package com.mobi.utils.cli;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.etl.api.config.rdf.export.RDFExportConfig;
import com.mobi.etl.api.rdf.export.RDFExportService;
import com.mobi.exception.MobiException;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryConfig;
import com.mobi.repository.impl.sesame.nativestore.NativeRepositoryConfig;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.utils.cli.operations.post.FixWorkflowOntology;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.time.StopWatch;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.Update;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.ServiceReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.InvalidPathException;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Command(scope = "mobi", name = "backup", description = "Backs up the Mobi installation")
@Service
public class Backup implements Action {

    private static final Logger LOGGER = LoggerFactory.getLogger(Backup.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    private static final String PROP_FILENAME = "/application.properties";

    private static final String UPDATE_BASE_PATH_EXECUTIONS;

    static {
        try {
            UPDATE_BASE_PATH_EXECUTIONS = IOUtils.toString(
                    Objects.requireNonNull(
                            FixWorkflowOntology.class.getResourceAsStream("/updateBinaryFile_Query.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    final ValueFactory vf = new ValidatingValueFactory();

    // Service References
    @Reference
    private RepositoryManager repoManager;

    void setRepoManager(RepositoryManager repoManager) {
        this.repoManager = repoManager;
    }

    @Reference
    private RDFExportService exportService;

    void setExportService(RDFExportService exportService) {
        this.exportService = exportService;
    }

    @Option(name = "-o", aliases = "--output-path", description = "The path to the output file")
    @Completion(FileCompleter.class)
    protected String filePath = null;

    @Option(name = "-b", aliases = "--base-path",
            description = "The home directory of the target distribution for restore")
    @Completion(FileCompleter.class)
    protected String basePath = null;

    @Override
    public Object execute() throws Exception {
        StopWatch watch = new StopWatch();
        watch.start();
        LOGGER.debug("Starting backup");
        ObjectNode manifest = mapper.createObjectNode();
        LOGGER.trace("Loading properties file");
        Properties properties = loadProperties();
        LOGGER.trace("Loaded properties file");
        manifest.put("version", properties.getProperty("application.version"));
        OffsetDateTime date = OffsetDateTime.now();
        File outputFile = getOutputFile(date);
        manifest.put("date", date.toString());

        try (ZipOutputStream mainZip = new ZipOutputStream(new FileOutputStream(outputFile))) {
            // Repositories
            ObjectNode repositories = mapper.createObjectNode();
            Map<String, OsgiRepository> repos = repoManager.getAllRepositories();
            for (String repoId : repos.keySet()) {
                OsgiRepository repo = repos.get(repoId);
                if (basePath != null) {
                    try (RepositoryConnection conn = repo.getConnection()) {
                        conn.begin();
                        updateRetrievalUrl(conn);
                        Model repoModel = QueryResults.asModel(conn.getStatements(null, null, null));
                        backupRepository(outputFile, repositories, repo, repoId, mainZip, repoModel);
                        conn.rollback();
                    }
                } else {
                    backupRepository(outputFile, repositories, repo, repoId, mainZip, null);
                }
            }
            LOGGER.trace("Backed up the repositories to the zip");
            manifest.set("repositories", repositories);

            String dataPath = getKarafHome().getAbsolutePath() + "/data/virtualFiles";

            // Policies
            LOGGER.trace("Backing up the policies");
            ServiceReference<XACMLPolicyManager> serviceRef = FrameworkUtil.getBundle(XACMLPolicyManager.class)
                    .getBundleContext().getServiceReference(XACMLPolicyManager.class);
            if (serviceRef == null) {
                throw new IllegalStateException("Policy Manager service is not available");
            }
            String policyFileLocation = (String) serviceRef.getProperty("policyFileLocation");
            LOGGER.trace("Identified policy directory as " + policyFileLocation);
            File policyDir = new File(policyFileLocation);

            if (!policyDir.getParentFile().getAbsolutePath().equals(dataPath)) {
                ByteArrayOutputStream policiesOut = new ByteArrayOutputStream();
                try (ZipOutputStream policiesZip = new ZipOutputStream(policiesOut)) {
                    addFolderToZip(policyDir, policyDir, policiesZip);
                }
                final ZipEntry policiesZipEntry = new ZipEntry("policies.zip");
                mainZip.putNextEntry(policiesZipEntry);
                mainZip.write(policiesOut.toByteArray());
                LOGGER.trace("Backed up the policies to the zip");
            }

            // Backing up Karaf data directory
            backupDataDirectory(mainZip, dataPath);

            // Configurations
            LOGGER.trace("Backing up the configurations");
            File etc = getConfigFileDir();
            ByteArrayOutputStream configOut = new ByteArrayOutputStream();
            try (ZipOutputStream configZip = new ZipOutputStream(configOut)) {
                addConfigFolderToZip(etc, etc, configZip);
            }
            final ZipEntry configZipEntry = new ZipEntry("configurations.zip");
            mainZip.putNextEntry(configZipEntry);
            mainZip.write(configOut.toByteArray());
            LOGGER.trace("Backed up the configurations to the zip");

            // Manifest
            LOGGER.trace("Writing manifest: " + manifest);
            final ZipEntry manifestZipEntry = new ZipEntry("manifest.json");
            mainZip.putNextEntry(manifestZipEntry);
            mainZip.write(manifest.toPrettyString().getBytes());
            LOGGER.trace("Manifest added to zip");
        } catch (Exception ex) {
            if (outputFile.exists()) {
                outputFile.delete();
            }
            throw ex;
        } finally {
            watch.stop();
        }
        LOGGER.debug("Finished backup after " + watch.getTime() + "ms");
        System.out.println("Back up complete at " + outputFile.getAbsolutePath());
        return null;
    }

    private void backupDataDirectory(ZipOutputStream mainZip, String dataPath) throws Exception {
        LOGGER.trace("Backing up the data directory");

        File dataDirectory = new File(dataPath);
        ByteArrayOutputStream karafDataOut = new ByteArrayOutputStream();

        try (ZipOutputStream karafDataZip = new ZipOutputStream(karafDataOut)) {
            addFolderToZip(dataDirectory, dataDirectory, karafDataZip);
        }

        final ZipEntry karafDataZipEntry = new ZipEntry("data.zip");
        mainZip.putNextEntry(karafDataZipEntry);
        mainZip.write(karafDataOut.toByteArray());
        LOGGER.trace("Backed up the karaf data directory to the zip");
    }

    private void backupRepository(File outputFile, ObjectNode repositories, OsgiRepository repo,  String repoId,
                                  ZipOutputStream mainZip, Model model) throws Exception {
        try {
            Class<?> repoConfigType = repo.getConfigType();
            if (repoConfigType.equals(NativeRepositoryConfig.class)
                    || repoConfigType.equals(MemoryRepositoryConfig.class)) {
                LOGGER.trace("Backing up the " + repoId + " repository");
                ByteArrayOutputStream repoOut = new ByteArrayOutputStream();
                try (ZipOutputStream repoZip = new ZipOutputStream(repoOut)) {
                    final ZipEntry repoEntry = new ZipEntry(repoId + ".trig");
                    repoZip.putNextEntry(repoEntry);
                    RDFExportConfig config = new RDFExportConfig.Builder(repoZip, RDFFormat.TRIG).build();
                    if (model == null) {
                        exportService.export(config, repoId);
                    } else {
                        exportService.export(config, model);
                    }
                }
                repositories.put(repoId, "repos/" + repoId + ".zip");
                final ZipEntry repoZipEntry = new ZipEntry("repos/" + repoId + ".zip");
                mainZip.putNextEntry(repoZipEntry);
                mainZip.write(repoOut.toByteArray());
                System.out.println("Backed up the " + repoId + " repository");
                LOGGER.trace("Backed up the " + repoId + " repository");
            } else {
                System.out.println("Skipping back up of non Native/Memory Repository: " + repoId);
                LOGGER.trace("Skipping back up of non Native/Memory Repository: " + repoId);
            }
        } catch (Exception ex) {
            if (outputFile.exists()) {
                outputFile.delete();
            }
            throw ex;
        }
    }

    private File getOutputFile(OffsetDateTime date) throws Exception {
        if (filePath == null) {
            return File.createTempFile(date.format(DateTimeFormatter.BASIC_ISO_DATE), ".zip", getKarafHome());
        } else {
            return new File(filePath);
        }
    }

    private void addFileToZip(File rootPath, File srcFile, ZipOutputStream zip) throws Exception {

        if (srcFile.isDirectory()) {
            addFolderToZip(rootPath, srcFile, zip);
        } else {
            byte[] buf = new byte[1024];
            int len;
            try (FileInputStream in = new FileInputStream(srcFile)) {
                String name = srcFile.getPath();
                name = name.replace(rootPath.getPath(), "");
                name = name.substring(1);
                name = name.replaceAll("\\\\", "/");
                LOGGER.trace("Zip " + srcFile + "\n to " + name);
                zip.putNextEntry(new ZipEntry(name));
                while ((len = in.read(buf)) > 0) {
                    zip.write(buf, 0, len);
                }
            }
        }
    }

    private void addFolderToZip(File rootPath, File srcFolder, ZipOutputStream zip) throws Exception {
        for (File fileName : Objects.requireNonNull(srcFolder.listFiles())) {
            addFileToZip(rootPath, fileName, zip);
        }
    }

    private void addConfigFolderToZip(File rootPath, File srcFolder, ZipOutputStream zip) throws Exception {
        List<String> blacklistedFiles = IOUtils.readLines(Objects.requireNonNull(getClass()
                        .getResourceAsStream("/configBlacklist.txt")),
                StandardCharsets.UTF_8);
        for (File fileName : Objects.requireNonNull(srcFolder.listFiles())) {
            if (!blacklistedFiles.contains(fileName.getName())) {
                addFileToZip(rootPath, fileName, zip);
            }
        }
    }

    private Properties loadProperties() throws Exception {
        Properties prop = new Properties();
        InputStream inputStream = getClass().getResourceAsStream(PROP_FILENAME);

        if (inputStream != null) {
            prop.load(inputStream);
        } else {
            throw new FileNotFoundException("Property file '" + PROP_FILENAME + "' not found in the classpath.");
        }
        return prop;
    }

    private File getConfigFileDir() {
        String karafEtc = System.getProperty("karaf.etc");
        if (karafEtc == null) {
            throw new IllegalStateException("karaf.etc is not set");
        }
        return new File(karafEtc);
    }

    private File getKarafHome() {
        String karafHome = System.getProperty("karaf.home");
        if (karafHome == null) {
            throw new IllegalStateException("karaf.home is not set");
        }
        return new File(karafHome);
    }

    private void updateRetrievalUrl(RepositoryConnection conn) {
        try {
            //checks to ensure the Path is not malformed
            Paths.get(basePath);

            String newPath = "file://" + basePath;
            Value pathValue = vf.createLiteral(newPath);
            Update query = conn.prepareUpdate(UPDATE_BASE_PATH_EXECUTIONS);
            query.setBinding("homeDirectory", vf.createLiteral(getKarafHome().getAbsolutePath()));
            query.setBinding("basePath", pathValue);
            query.execute();
        } catch (InvalidPathException ex) {
            throw new IllegalArgumentException("The file path is malformed: " + ex.getMessage());
        }
    }
}
