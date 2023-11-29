package com.mobi.utils.cli;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryConfig;
import com.mobi.repository.impl.sesame.nativestore.NativeRepositoryConfig;
import com.mobi.security.api.EncryptionService;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.utils.cli.api.ConfigRestoreOperation;
import com.mobi.utils.cli.api.ExecutableRestoreOperation;
import com.mobi.utils.cli.api.PostRestoreOperation;
import com.mobi.utils.cli.api.PreRestoreOperation;
import com.mobi.utils.cli.impl.ConfigRestoreOperationHandler;
import com.mobi.utils.cli.impl.ManifestFile;
import com.mobi.utils.cli.impl.PostRestoreOperationHandler;
import com.mobi.utils.cli.impl.PreRestoreOperationHandler;
import com.mobi.utils.cli.utils.RestoreUtils;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;
import org.apache.karaf.system.SystemService;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.InvalidSyntaxException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

@Command(scope = "mobi", name = "restore", description = "Restores Mobi backup and will handle migration if versions "
        + "differ")
@Service
public class Restore implements Action {
    private static final Logger LOGGER = LoggerFactory.getLogger(Restore.class);
    public static final Integer CONFIG_RESTART_TIMEOUT = 20;
    private static final String RESTORE_PATH = System.getProperty("java.io.tmpdir") + File.separator + "restoreZip";
    public static final String CONFIG_PATH = RESTORE_PATH + File.separator + "configurations";
    public static final String MANIFEST_FILE = RESTORE_PATH + File.separator + "manifest.json";
    private final List<String> mobiVersions = Arrays.asList("1.12", "1.13", "1.14", "1.15", "1.16", "1.17",
            "1.18", "1.19", "1.20", "1.21", "1.22", "2.0", "2.1", "2.2", "2.3", "2.4", "2.5");

    // Service References
    @Reference
    protected SystemService systemService;

    @Reference
    protected RepositoryManager repositoryManager;

    @Reference
    protected RDFImportService importService;

    @Reference
    protected StateManager stateManager;

    @Reference(optional = true)
    volatile private EncryptionService encryptionService;

    @Reference
    protected CatalogConfigProvider config;

    @Reference
    ConfigRestoreOperationHandler configRestoreOperationHandler;

    @Reference
    PreRestoreOperationHandler preRestoreOperationHandler;

    @Reference
    PostRestoreOperationHandler postRestoreOperationHandler;

    // Command Parameters
    @Argument(name = "BackupFile", description = "The Mobi backup to restore", required = true)
    @Completion(FileCompleter.class)
    private String backupFilePath = null;

    @Option(name = "-b", aliases = "--batchSize", description = "The number representing the triple transaction size "
            + "for importing.")
    private long batchSize = 10000;

    // Implementation

    /**
     * Execute Restore
     * Steps:
     * - Unzip backup zip file
     * - Read Manifest File
     * - ConfigRestoreOperationHandler
     * - PreRestoreOperationHandler
     * - Clear All Repos
     * - Restore Repos
     * - PostRestoreOperationHandler
     * - Clear temp restore folder
     * - Restart XACMLPolicyManager bundle - recreate policies that were deleted
     * - Restarting all services
     *
     * @return Object
     * @throws Exception
     */
    @Override
    public Object execute() throws Exception {
        try {
            out(String.format("== Unzipping: %s", backupFilePath.trim()));
            RestoreUtils.unzipFile(backupFilePath, RESTORE_PATH);
        } catch (IOException e) {
            error("Error unzipping backup file: " + e.getMessage(), e);
            return null;
        }

        ManifestFile manifestFile = ManifestFile.fromJson(MANIFEST_FILE, mobiVersions);
        if(manifestFile.getError().isPresent()){
            error(manifestFile.getError().get());
            return null;
        }

        JSONObject manifestRepos = manifestFile.getRepositories();
        String backupVersion = manifestFile.getVersion();
        out("== Restoring Version: " + backupVersion);

        BundleContext xacmlBundleContext = FrameworkUtil.getBundle(XACMLPolicyManager.class).getBundleContext();

        out("== Configuration Stage");
        copyConfigFiles(xacmlBundleContext, backupVersion);

        out("== Pre-Process Stage");
        restorePreProcess(backupVersion);

        out("== Clearing All Repos");
        Set<String> remoteRepos = clearAllRepos(repositoryManager);

        out("== Restoring Manifest Repos");
        restoreRepositories(manifestRepos, remoteRepos);

        out("== Post-Process Stage");
        restorePostProcess(backupVersion);

        out("== Deleting Temporary Restore Directory");
        File tempArchive = new File(RESTORE_PATH);
        tempArchive.delete();

        out("== Restarting XACMLPolicyManager bundle ="); // recreate policies that were deleted
        long start = System.currentTimeMillis();
        xacmlBundleContext.getBundle().update();
        out("== Restarted XACMLPolicyManager bundle. Took:" + (System.currentTimeMillis() - start) + " ms");

        out("== Restarting all services");
        systemService.reboot();
        return null;
    }

    private void copyConfigFiles(BundleContext bundleContext, String version) throws IOException, InterruptedException,
            InvalidSyntaxException {
        try {
            // Copy config files to karaf.etc directory
            List<String> repoServices = new ArrayList<>();
            File configDir = new File(CONFIG_PATH);

            // Generate list of repoServices from the repository configuration filenames in the backup
            File[] repoFiles = configDir.listFiles((d, name) -> name.contains("com.mobi.service.repository"));
            if (repoFiles != null && repoFiles.length != 0) {
                for (File repoFile : repoFiles) {
                    String filename = repoFile.getName();
                    StringBuilder sb = new StringBuilder("(&(objectClass=com.mobi.repository.api.OsgiRepository)"
                            + "(component.name=");
                    sb.append(filename, 0, filename.indexOf("-"));
                    sb.append(")(id=");
                    sb.append(filename, filename.indexOf("-") + 1, filename.indexOf(".cfg"));
                    sb.append("))");
                    repoServices.add(sb.toString());
                }
            }

            Set<String> blacklistedFiles = new HashSet<>();

            List<ConfigRestoreOperation> configRestoreOperations = configRestoreOperationHandler.getOperations(version);
            configRestoreOperations.forEach((ConfigRestoreOperation operation) -> {
                try {
                    List<String> excludedFiles = operation.getExcludedFiles();
                    out(String.format("Running Operation %s with priority %s for versions %s," +
                                    " excludedFiles count: %s", operation.getClass(), operation.getPriority(),
                            operation.getVersionRange(), excludedFiles.size()));
                    blacklistedFiles.addAll(excludedFiles);
                } catch (InvalidVersionSpecificationException e) {
                    error(e.getMessage(), e);
                }
            });

            // Merge directories, replacing any file that already exists
            Path src = Paths.get(RESTORE_PATH + File.separator + "configurations" + File.separator);
            Path dest = Paths.get(System.getProperty("karaf.etc") + File.separator);
            if (encryptionService != null) {
                encryptionService.disable();
            }

            try (Stream<Path> stream = Files.walk(src)) {
                stream.forEach(backupConfig -> {
                    try {
                        boolean isSystemPolicy = RestoreUtils.containsSubPath(backupConfig, Paths.get("policies/systemPolicies"));
                        Path newFileDest = dest.resolve(src.relativize(backupConfig));
                        if (Files.isDirectory(backupConfig)) {
                            if (!Files.exists(newFileDest)) {
                                Files.createDirectory(newFileDest);
                                LOGGER.trace("Created directory: " + newFileDest.getFileName().toString());
                            }
                        } else if (isSystemPolicy && Files.exists(newFileDest)) {
                            LOGGER.trace("Skipping restore of file: " + newFileDest.getFileName().toString());
                            return;
                        } else if (!blacklistedFiles.contains(newFileDest.getFileName().toString())) {
                            Files.copy(backupConfig, newFileDest, StandardCopyOption.REPLACE_EXISTING);
                        } else {
                            LOGGER.trace("Skipping restore of file: " + newFileDest.getFileName().toString());
                        }
                    } catch (IOException e) {
                        LOGGER.error("Could not copy file: " + backupConfig.getFileName());
                    }
                });
            }
            out(String.format("Waiting %s seconds for services to restart after copying config files", CONFIG_RESTART_TIMEOUT));
            TimeUnit.SECONDS.sleep(CONFIG_RESTART_TIMEOUT);
            List<String> services = IOUtils.readLines(getClass().getResourceAsStream("/registered-services.txt"),
                    StandardCharsets.UTF_8);
            services.addAll(repoServices);

            RestoreUtils.verifyServices(bundleContext, repoServices);
        } catch (IOException e) {
            if (encryptionService != null) {
                encryptionService.enable();
            }
            throw e;
        }
    }

    /**
     * Clear All Repos
     *
     * @param repositoryManager Repository Manager
     * @return A list of remote repos
     */
    protected Set<String> clearAllRepos(RepositoryManager repositoryManager) {
        Set<String> remoteRepos = new HashSet<>();
        repositoryManager.getAllRepositories().forEach((repoID, repo) -> {
            if (repo.getConfigType().equals(NativeRepositoryConfig.class)
                    || repo.getConfigType().equals(MemoryRepositoryConfig.class)) {
                try (RepositoryConnection connection = repo.getConnection()) {
                    connection.clear();
                }
            } else {
                remoteRepos.add(repoID);
            }
        });
        return remoteRepos;
    }

    private void restoreRepositories(JSONObject manifestRepos, Set<String> remoteRepos) throws IOException {
        // Populate Repositories
        ImportServiceConfig.Builder builder = new ImportServiceConfig.Builder()
                .continueOnError(false)
                .logOutput(true)
                .printOutput(true)
                .batchSize(batchSize);

        for (Object key : manifestRepos.keySet()) {
            String repoName = key.toString();
            if (!remoteRepos.contains(repoName)) {
                String repoPath = manifestRepos.optString(key.toString());
                String repoDirectoryPath = repoPath.substring(0, repoPath.lastIndexOf(repoName + ".zip"));
                builder.repository(repoName);
                File repoFile = new File(RESTORE_PATH + File.separator + repoDirectoryPath + File.separator
                        + repoName + ".trig");
                long startTime = System.currentTimeMillis();
                importService.importFile(builder.build(), repoFile);
                long endTime = System.currentTimeMillis();
                out(String.format("Data successfully loaded to %s repository. Took %s ms", repoName, endTime - startTime));
            } else {
                out("Skipping data load of remote repository " + repoName);
            }
        }
    }

    /**
     * Restore Pre-Process
     *
     * @param backupVersion Backup Version
     */
    private void restorePreProcess(String backupVersion){
        List<PreRestoreOperation> preRestoreOperations = preRestoreOperationHandler.getOperations(backupVersion);
        executeRestoreOperations(preRestoreOperations);
    }

    /**
     * Restore Process Post-processing
     *
     * @param backupVersion Backup Version
     */
    protected void restorePostProcess(String backupVersion) {
        List<PostRestoreOperation> postRestoreOperations = postRestoreOperationHandler.getOperations(backupVersion);
        executeRestoreOperations(postRestoreOperations);
    }

    /**
     * Execute list of ExecutableRestoreOperation
     * @param executableRestoreOperation List of ExecutableRestore Operations
     */
    private void executeRestoreOperations(List<? extends ExecutableRestoreOperation> executableRestoreOperation) {
        executableRestoreOperation.forEach((ExecutableRestoreOperation operation) -> {
            try {
                long startTime = System.currentTimeMillis();
                operation.execute();
                long endTime = System.currentTimeMillis();
                out(String.format("Executed Operation %s with priority %s for versions %s, took %s ms",
                        operation.getClass(), operation.getPriority(), operation.getVersionRange(), endTime - startTime));
            } catch (Exception e) {
                error(e.getMessage(), e);
            }
        });
    }

    private void out(String msg) {
        LOGGER.trace(msg);
        System.out.println(msg);
    }

    private void error(String msg) {
        LOGGER.error(msg);
        System.out.println(msg);
    }

    private void error(String msg, Exception e) {
        LOGGER.error(msg, e);
        System.out.println(msg);
    }
}
