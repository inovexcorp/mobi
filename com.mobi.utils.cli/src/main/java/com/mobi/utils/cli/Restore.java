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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.platform.config.api.ontologies.platformconfig.State;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryConfig;
import com.mobi.repository.impl.sesame.nativestore.NativeRepositoryConfig;
import com.mobi.security.policy.api.ontologies.policy.PolicyFile;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import net.sf.json.JSONObject;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.InvalidSyntaxException;
import org.osgi.framework.ServiceReference;
import org.osgi.framework.wiring.FrameworkWiring;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Command(scope = "mobi", name = "restore", description = "Restores Mobi backup and will handle migration if versions "
        +  "differ")
@Service
public class Restore implements Action {

    private static final Logger LOGGER = LoggerFactory.getLogger(Restore.class);

    private static final String RESTORE_PATH = System.getProperty("java.io.tmpdir") + File.separator + "restoreZip";
    private final List<String> mobiVersions = Arrays.asList("1.12", "1.13", "1.14", "1.15", "1.16", "1.17", "1.18",
            "1.19", "1.20");

    // Service References

    @Reference
    private RepositoryManager repositoryManager;

    public void setRepositoryManager(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Reference
    private RDFImportService importService;

    void setImportService(RDFImportService importService) {
        this.importService = importService;
    }

    @Reference
    private StateManager stateManager;

    void setStateManager(StateManager stateManager) {
        this.stateManager = stateManager;
    }

    @Reference
    private CatalogConfigProvider config;

    void setConfig(CatalogConfigProvider config) {
        this.config = config;
    }

    @Reference
    private ValueFactory vf;

    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    // Command Parameters
    @Argument(name = "BackupFile", description = "The Mobi backup to restore", required = true)
    @Completion(FileCompleter.class)
    private String backupFilePath = null;

    @Option(name = "-b", aliases = "--batchSize", description = "The number representing the triple transaction size "
            + "for importing.")
    private long batchSize = 10000;

    // Implementation
    @Override
    public Object execute() throws Exception {
        // Unzip archive into temp directory
        try {
            unzipFile(backupFilePath, RESTORE_PATH);
        } catch (IOException e) {
            String msg = "Error unzipping backup file: " + e.getMessage();
            LOGGER.error(msg, e);
            System.out.println(msg);
            return null;
        }
        JSONObject manifest;
        try {
            String manifestStr = new String(Files.readAllBytes(Paths.get(RESTORE_PATH + File.separator
                    + "manifest.json")));
            manifest = JSONObject.fromObject(manifestStr);
        } catch (IOException e) {
            String msg = "Error loading manifest file: " + e.getMessage();
            LOGGER.error(msg, e);
            System.out.println(msg);
            return null;
        }

        String fullBackupVer = manifest.optString("version");
        if (StringUtils.isEmpty(fullBackupVer)) {
            String msg = "Manifest must contain the Mobi 'version' identifier of backup";
            LOGGER.error(msg);
            System.out.println(msg);
            return null;
        }
        Pattern versionPattern = Pattern.compile("([0-9]+\\.[0-9]+)");
        Matcher matcher = versionPattern.matcher(fullBackupVer);
        if (!matcher.find()) {
            String msg = "Mobi version in manifest must match regex pattern [0-9]+\\\\.[0-9]+";
            LOGGER.error(msg);
            System.out.println(msg);
            return null;
        }
        String backupVersion = matcher.group(1);
        if (!mobiVersions.contains(backupVersion)) {
            String msg = "A valid version of Mobi is required (" + String.join(".*, ", mobiVersions) + ").";
            LOGGER.error(msg);
            System.out.println(msg);
            return null;
        }

        BundleContext bundleContext = FrameworkUtil.getBundle(XACMLPolicyManager.class).getBundleContext();
        copyConfigFiles(bundleContext, backupVersion);
        if (!backupVersion.startsWith(mobiVersions.get(0))) {
            copyPolicyFiles(bundleContext);
        }
        restoreRepositories(manifest, backupVersion);

        File tempArchive = new File(RESTORE_PATH);
        tempArchive.delete();

        // Restart all services
        System.out.println("Restarting all services");
        LOGGER.trace("Restarting all services");
        Bundle systemBundle = bundleContext.getBundle(0);
        bundleContext.getBundle().update();
        FrameworkWiring frameworkWiring = systemBundle.adapt(FrameworkWiring.class);
        frameworkWiring.refreshBundles(null);

        return null;
    }

    private void copyConfigFiles(BundleContext bundleContext, String version) throws IOException, InterruptedException,
            InvalidSyntaxException {
        // Copy config files to karaf.etc directory

        List<String> repoServices = new ArrayList<>();
        File configDir = new File(RESTORE_PATH + File.separator + "configurations");

        // Generate list of repoServices from the repository configuration filenames in the the backup
        File[] repoFiles = configDir.listFiles((d, name) -> name.contains("com.mobi.service.repository"));
        if (repoFiles != null && repoFiles.length != 0) {
            for (File repoFile : repoFiles) {
                String filename = repoFile.getName();
                StringBuilder sb = new StringBuilder("(&(objectClass=com.mobi.repository.api.Repository)"
                        + "(component.name=");
                sb.append(filename, 0, filename.indexOf("-"));
                sb.append(")(id=");
                sb.append(filename, filename.indexOf("-") + 1, filename.indexOf(".cfg"));
                sb.append("))");
                repoServices.add(sb.toString());
            }
        }

        Set<String> blacklistedFiles = new HashSet<>((IOUtils.readLines(getClass()
                .getResourceAsStream("/configBlacklist.txt"), StandardCharsets.UTF_8)));
        if (version.startsWith(mobiVersions.get(0))) {
            LOGGER.trace("1.12 Mobi version detected. Blacklisting additional files from backup.");
            // Blacklist 1.12 default Karaf config files that have changed with Karaf 4.2.x upgrade
            // Blacklist also includes VFS config file with added directory property
            // Blacklist also includes PolicyCacheConfiguration config file for change between size to number of entries
            blacklistedFiles.addAll(IOUtils.readLines(getClass().getResourceAsStream("/configBlacklist-1.12.txt"),
                    StandardCharsets.UTF_8));
        }
        if (mobiVersions.indexOf(version) < mobiVersions.indexOf("1.19")) {
            LOGGER.trace("Version lower than 1.19 detected. Blacklisting additional files from backup.");
            // Blacklist karaf jre.properties file due to javax.xml.bind version for Java 8 in > 1.19
            blacklistedFiles.add("jre.properties");
        }

        // Merge directories, replacing any file that already exists
        Path src = Paths.get(RESTORE_PATH + File.separator + "configurations" + File.separator);
        Path dest = Paths.get(System.getProperty("karaf.etc") + File.separator);
        Files.walk(src).forEach(backupConfig -> {
            try {
                Path newFileDest = dest.resolve(src.relativize(backupConfig));
                if (Files.isDirectory(backupConfig)) {
                    if (!Files.exists(newFileDest)) {
                        Files.createDirectory(newFileDest);
                        LOGGER.trace("Created directory: " + newFileDest.getFileName().toString());
                    }
                } else if (!blacklistedFiles.contains(newFileDest.getFileName().toString())) {
                    Files.copy(backupConfig, newFileDest, StandardCopyOption.REPLACE_EXISTING);
                } else {
                    LOGGER.trace("Skipping restore of file: " + newFileDest.getFileName().toString());
                }
            } catch (IOException e) {
                LOGGER.error("Could not copy file: " + backupConfig.getFileName());
            }
        });

        System.out.println("Waiting for services to restart");
        TimeUnit.SECONDS.sleep(20);

        // Verify services have started
        List<String> services = IOUtils.readLines(getClass().getResourceAsStream("/registered-services.txt"),
                StandardCharsets.UTF_8);
        services.addAll(repoServices);
        for (String service : services) {
            ServiceReference<?>[] refs = bundleContext.getAllServiceReferences(null, service);
            int count = 0;
            while (refs == null && count < 2) {
                TimeUnit.SECONDS.sleep(5);
                refs = bundleContext.getAllServiceReferences(null, service);
                count++;
            }
            if (refs == null) {
                System.out.println("Could not find service " + service);
            }
        }
    }

    private void copyPolicyFiles(BundleContext bundleContext) throws IOException {
        // Copy policy files to proper destination
        ServiceReference<XACMLPolicyManager> serviceRef = bundleContext.getServiceReference(XACMLPolicyManager.class);
        if (serviceRef == null) {
            throw new IllegalStateException("Policy Manager service is not available");
        }
        String policyFileLocation = (String) serviceRef.getProperty("policyFileLocation");
        LOGGER.trace("Identified policy directory as " + policyFileLocation);
        File policyDir = new File(policyFileLocation);
        File tmpPolicyDir = new File(RESTORE_PATH + File.separator + "policies");
        FileUtils.copyDirectory(tmpPolicyDir, policyDir);
    }

    private void restoreRepositories(JSONObject manifest, String backupVersion) throws IOException {

        // Clear populated repositories
        Set<String> remoteRepos = new HashSet<>();
        repositoryManager.getAllRepositories().forEach((repoID, repo) -> {
            if (repo.getConfig() instanceof NativeRepositoryConfig
                    || repo.getConfig() instanceof MemoryRepositoryConfig) {
                try (RepositoryConnection connection = repo.getConnection()) {
                    connection.clear();
                }
            } else {
                remoteRepos.add(repoID);
            }
        });

        // Populate Repositories
        JSONObject repos = manifest.optJSONObject("repositories");
        ImportServiceConfig.Builder builder = new ImportServiceConfig.Builder()
                .continueOnError(false)
                .logOutput(true)
                .printOutput(true)
                .batchSize(batchSize);

        for (Object key : repos.keySet()) {
            String repoName = key.toString();
            if (!remoteRepos.contains(repoName)) {
                String repoPath = repos.optString(key.toString());
                String repoDirectoryPath = repoPath.substring(0, repoPath.lastIndexOf(repoName + ".zip"));
                builder.repository(repoName);
                File repoFile = new File(RESTORE_PATH + File.separator + repoDirectoryPath + File.separator
                        + repoName + ".trig");
                importService.importFile(builder.build(), repoFile);
                LOGGER.trace("Data successfully loaded to " + repoName + " repository.");
                System.out.println("Data successfully loaded to " + repoName + " repository.");
            } else {
                LOGGER.trace("Skipping data load of remote repository " + repoName);
                System.out.println("Skipping data load of remote repository " + repoName);
            }
        }

        // Remove Policy Statements
        RepositoryConnection conn = config.getRepository().getConnection();
        Iterator<Statement> statements = conn.getStatements(null,
                vf.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), vf.createIRI(PolicyFile.TYPE))
                .iterator();

        while (statements.hasNext()) {
            conn.clear(statements.next().getSubject());
        }
        LOGGER.trace("Removed PolicyFile statements");

        if (mobiVersions.indexOf(backupVersion) < 2) {
            // Clear ontology editor state
            statements = conn.getStatements(null,
                    vf.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), vf.createIRI(State.TYPE)).iterator();

            while (statements.hasNext()) {
                stateManager.deleteState(statements.next().getSubject());
            }
            LOGGER.trace("Remove state statements");
        }
    }

    private void unzipFile(String filePath, String destination) throws IOException {
        File destDir = new File(destination);
        byte[] buffer = new byte[1024];
        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(filePath))) {
            ZipEntry zipEntry = zis.getNextEntry();
            while (zipEntry != null) {
                File newFile;
                // For malformed zip files
                if (zipEntry.getName().contains("\\")) {
                    String[] pathParts = zipEntry.getName().split("\\\\");

                    String path = destination;
                    for (int i = 0; i < pathParts.length - 1; i++) {
                        path = path + File.separator + pathParts[i];
                        File directory = new File(path);
                        if (!directory.getParentFile().exists()) {
                            directory.getParentFile().mkdirs();
                        }
                        directory.mkdir();
                    }
                    newFile = new File(path + File.separator + pathParts[pathParts.length - 1]);
                } else {
                    // Normal processing
                    newFile = newFile(destDir, zipEntry);
                    if (zipEntry.isDirectory()) {
                        newFile.mkdirs();
                        zipEntry = zis.getNextEntry();
                        continue;
                    }
                    if (!newFile.getParentFile().exists()) {
                        newFile.getParentFile().mkdirs();
                    }
                }
                try (FileOutputStream fos = new FileOutputStream(newFile)) {
                    int len;
                    while ((len = zis.read(buffer)) > 0) {
                        fos.write(buffer, 0, len);
                    }
                    zipEntry = zis.getNextEntry();
                }
                if (newFile.getAbsolutePath().endsWith("configurations.zip")
                        || newFile.getAbsolutePath().endsWith("policies.zip")) {
                    unzipFile(newFile.getAbsolutePath(), newFile.getParentFile().getAbsolutePath()
                            + File.separator + FilenameUtils.removeExtension(newFile.getName()));
                } else if (newFile.getAbsolutePath().endsWith(".zip")) {
                    unzipFile(newFile.getAbsolutePath(), newFile.getParentFile().getAbsolutePath());
                }
            }
        }
    }

    private File newFile(File destinationDir, ZipEntry zipEntry) throws IOException {
        File destFile = new File(destinationDir, zipEntry.getName());

        String destDirPath = destinationDir.getCanonicalPath();
        String destFilePath = destFile.getCanonicalPath();

        if (!destFilePath.startsWith(destDirPath + File.separator)) {
            throw new IOException("Entry is outside of the target dir: " + zipEntry.getName());
        }

        return destFile;
    }
}