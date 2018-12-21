package com.mobi.utils.cli;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.etl.api.config.rdf.export.RDFExportConfig;
import com.mobi.etl.api.rdf.export.RDFExportService;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.time.StopWatch;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;
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
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Command(scope = "mobi", name = "backup", description = "Backs up the Mobi installation")
@Service
public class Backup implements Action {

    private static final Logger LOGGER = LoggerFactory.getLogger(Backup.class);

    private static final String PROP_FILENAME = "/application.properties";

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

    @Option(name = "-f", aliases = "--file-path", description = "The path to the output file")
    @Completion(FileCompleter.class)
    private String filePath = null;

    @Override
    public Object execute() throws Exception {
        StopWatch watch = new StopWatch();
        watch.start();
        LOGGER.debug("Starting backup");
        JSONObject manifest = new JSONObject();
        LOGGER.trace("Loading properties file");
        Properties properties = loadProperties();
        LOGGER.trace("Loaded properties file");
        manifest.accumulate("version", properties.getProperty("application.version"));
        OffsetDateTime date = OffsetDateTime.now();
        File outputFile = getOutputFile(date);
        manifest.accumulate("date", date.toString());

        try (ZipOutputStream mainZip = new ZipOutputStream(new FileOutputStream(outputFile))) {
            // Repositories
            JSONObject repositories = new JSONObject();
            Map<String, Repository> repos = repoManager.getAllRepositories();
            for (String repoId : repos.keySet()) {
                LOGGER.trace("Backing up the " + repoId + " repository");
                ByteArrayOutputStream repoOut = new ByteArrayOutputStream();
                try (ZipOutputStream repoZip = new ZipOutputStream(repoOut)) {
                    final ZipEntry repoEntry = new ZipEntry(repoId + ".trig");
                    repoZip.putNextEntry(repoEntry);
                    RDFExportConfig config = new RDFExportConfig.Builder(repoZip, RDFFormat.TRIG).build();
                    exportService.export(config, repoId);
                }
                repositories.accumulate(repoId, "repos/" + repoId + ".zip");
                final ZipEntry repoZipEntry = new ZipEntry("repos/" + repoId + ".zip");
                mainZip.putNextEntry(repoZipEntry);
                mainZip.write(repoOut.toByteArray());
                LOGGER.trace("Backed up the " + repoId + " repository");
            }
            LOGGER.trace("Backed up the repositories to the zip");
            manifest.accumulate("repositories", repositories);

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
            ByteArrayOutputStream policiesOut = new ByteArrayOutputStream();
            try (ZipOutputStream policiesZip = new ZipOutputStream(policiesOut)) {
                addFolderToZip(policyDir, policyDir, policiesZip);
            }
            final ZipEntry policiesZipEntry = new ZipEntry("policies.zip");
            mainZip.putNextEntry(policiesZipEntry);
            mainZip.write(policiesOut.toByteArray());
            LOGGER.trace("Backed up the policies to the zip");

            // Configurations
            LOGGER.trace("Backing up the configurations");
            File etc = getConfigFileDir();
            ByteArrayOutputStream configOut = new ByteArrayOutputStream();
            try (ZipOutputStream configZip = new ZipOutputStream(configOut)) {
                addFolderToZip(etc, etc, configZip);
            }
            final ZipEntry configZipEntry = new ZipEntry("configurations.zip");
            mainZip.putNextEntry(configZipEntry);
            mainZip.write(configOut.toByteArray());
            LOGGER.trace("Backed up the configurations to the zip");

            // Manifest
            LOGGER.trace("Writing manifest", manifest);
            final ZipEntry manifestZipEntry = new ZipEntry("manifest.json");
            mainZip.putNextEntry(manifestZipEntry);
            mainZip.write(manifest.toString(4).getBytes());
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
}
