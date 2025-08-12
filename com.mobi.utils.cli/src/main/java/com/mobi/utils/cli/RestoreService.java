package com.mobi.utils.cli;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryConfig;
import com.mobi.repository.impl.sesame.nativestore.NativeRepositoryConfig;
import com.mobi.security.api.EncryptionService;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.utils.cli.api.ConfigRestoreOperation;
import com.mobi.utils.cli.api.EndRestoreException;
import com.mobi.utils.cli.api.ExecutableRestoreOperation;
import com.mobi.utils.cli.api.PostRestoreOperation;
import com.mobi.utils.cli.api.PreRestoreOperation;
import com.mobi.utils.cli.impl.ConfigRestoreOperationHandler;
import com.mobi.utils.cli.impl.ManifestFile;
import com.mobi.utils.cli.impl.PostRestoreOperationHandler;
import com.mobi.utils.cli.impl.PreRestoreOperationHandler;
import com.mobi.utils.cli.utils.RestoreUtils;
import com.mobi.utils.cli.utils.VersionRangeUtils;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.system.SystemService;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.InvalidSyntaxException;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
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
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Stream;

@Component(immediate = true, service = RestoreService.class)
public class RestoreService {
    private static final Logger LOGGER = LoggerFactory.getLogger(RestoreService.class);
    public static final Integer CONFIG_RESTART_TIMEOUT = 20;
    private static final String RESTORE_PATH = System.getProperty("java.io.tmpdir") + File.separator + "restoreZip";
    public static final String CONFIG_PATH = RESTORE_PATH + File.separator + "configurations";
    public static final String MANIFEST_FILE = RESTORE_PATH + File.separator + "manifest.json";
    private final List<String> mobiVersions = Arrays.asList("1.12", "1.13", "1.14", "1.15", "1.16", "1.17",
            "1.18", "1.19", "1.20", "1.21", "1.22", "2.0", "2.1", "2.2", "2.3", "2.4", "2.5", "3.0", "3.1", "4.0",
            "4.1", "4.2");
    private final ReentrantLock lock = new ReentrantLock();

    // Service References
    @Reference
    protected SystemService systemService;

    @Reference
    protected RepositoryManager repositoryManager;

    @Reference
    protected RDFImportService importService;

    @Reference(cardinality = ReferenceCardinality.OPTIONAL)
    private volatile EncryptionService encryptionService;

    @Reference
    protected CatalogConfigProvider config;

    @Reference
    ConfigRestoreOperationHandler configRestoreOperationHandler;

    @Reference
    PreRestoreOperationHandler preRestoreOperationHandler;

    @Reference
    PostRestoreOperationHandler postRestoreOperationHandler;

    public boolean execute(String backupFilePath, long batchSize) throws Exception {
        if (!lock.tryLock()) {
            RestoreUtils.error("A restore operation is already in progress. Please wait for it to complete.", LOGGER);
            return false;
        }

        try {
            return handleRestore(backupFilePath, batchSize);
        } finally {
            lock.unlock();
        }
    }

    private boolean handleRestore(String backupFilePath, long batchSize) throws Exception {
        try {
            RestoreUtils.out(String.format("== Unzipping: %s", backupFilePath.trim()), LOGGER);
            RestoreUtils.unzipFile(backupFilePath, RESTORE_PATH);
        } catch (IOException e) {
            RestoreUtils.error("Error unzipping backup file: " + e.getMessage(), e, LOGGER);
            return false;
        }

        ManifestFile manifestFile = ManifestFile.fromJson(MANIFEST_FILE, mobiVersions);
        if (manifestFile.getError().isPresent()) {
            RestoreUtils.error(manifestFile.getError().get(), LOGGER);
            return false;
        }

        ObjectNode manifestRepos = manifestFile.getRepositories();
        String backupVersion = manifestFile.getVersion();
        RestoreUtils.out("== Restoring Version: " + backupVersion, LOGGER);

        try {
            BundleContext xacmlBundleContext = FrameworkUtil.getBundle(XACMLPolicyManager.class).getBundleContext();

            RestoreUtils.out("== Configuration Stage", LOGGER);
            copyConfigFiles(xacmlBundleContext, backupVersion);

            RestoreUtils.out("== Pre-Process Stage", LOGGER);
            restorePreProcess(backupVersion);

            RestoreUtils.out("== Clearing All Repos", LOGGER);
            Set<String> remoteRepos = clearAllRepos(repositoryManager);

            RestoreUtils.out("== Restoring Manifest Repos", LOGGER);
            restoreRepositories(manifestRepos, remoteRepos, backupVersion, batchSize);

            RestoreUtils.out("== Post-Process Stage", LOGGER);
            restorePostProcess(backupVersion);

            RestoreUtils.out("== Deleting Temporary Restore Directory", LOGGER);
            File tempArchive = new File(RESTORE_PATH);
            FileUtils.deleteDirectory(tempArchive);

            RestoreUtils.out("== Restarting XACMLPolicyManager bundle =", LOGGER); // recreate policies that were deleted
            long start = System.currentTimeMillis();
            xacmlBundleContext.getBundle().update();
            RestoreUtils.out("== Restarted XACMLPolicyManager bundle. Took:"
                    + (System.currentTimeMillis() - start) + " ms", LOGGER);

            RestoreUtils.out("== Restarting all services", LOGGER);
            systemService.reboot();
            return true;
        } catch (EndRestoreException e) {
            RestoreUtils.out("== Deleting Temporary Restore Directory", LOGGER);
            File tempArchive = new File(RESTORE_PATH);
            FileUtils.deleteDirectory(tempArchive);
            return false;
        }
    }

    private void copyConfigFiles(BundleContext bundleContext, String version) throws IOException, InterruptedException,
            InvalidSyntaxException {
        try {
            // Copy config files to karaf.etc directory
            List<String> repoServices = new ArrayList<>();
            File configDir = new File(CONFIG_PATH);

            String repoPrefix = "com.mobi.service.repository";
            // Generate list of repoServices from the repository configuration filenames in the backup
            File[] repoFiles = configDir.listFiles((dir, name) -> name.contains(repoPrefix));
            if (repoFiles != null) {
                for (File repoFile : repoFiles) {
                    String filename = repoFile.getName();
                    addRepoService(filename, repoServices);
                }
            }

            Set<String> blacklistedFiles = new HashSet<>();

            List<ConfigRestoreOperation> configRestoreOperations = configRestoreOperationHandler.getOperations(version);
            configRestoreOperations.forEach((ConfigRestoreOperation operation) -> {
                try {
                    List<String> excludedFiles = operation.getExcludedFiles();
                    if (!excludedFiles.isEmpty()) {
                        RestoreUtils.out(String.format("Running Operation %s with priority %s for versions %s,"
                                        + " excludedFiles count: %s", operation.getClass(), operation.getPriority(),
                                operation.getVersionRange(), excludedFiles.size()), LOGGER);
                        blacklistedFiles.addAll(excludedFiles);
                    }
                    List<String> addedFiles = operation.addConfig();
                    if (!addedFiles.isEmpty()) {
                        RestoreUtils.out(String.format("Running Operation %s with priority %s for versions %s,"
                                        + " added files: %s", operation.getClass(), operation.getPriority(),
                                operation.getVersionRange(), StringUtils.join(addedFiles, ", ")), LOGGER);
                        addedFiles.forEach(filename -> {
                            if (filename.startsWith(repoPrefix)) {
                                addRepoService(filename, repoServices);
                            }
                        });
                    }
                } catch (InvalidVersionSpecificationException | MobiException e) {
                    RestoreUtils.error(operation, e.getMessage(), e, LOGGER);
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
                        boolean isSystemPolicy = RestoreUtils.containsSubPath(backupConfig,
                                Paths.get("policies/systemPolicies"));
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
                            LOGGER.trace("Skipping restore of file: " + newFileDest.getFileName());
                        }
                    } catch (IOException e) {
                        RestoreUtils.error("Could not copy file: " + backupConfig.getFileName(), LOGGER);
                    }
                });
            }
            RestoreUtils.out(String.format("Waiting %s seconds for services to restart after copying config files",
                    CONFIG_RESTART_TIMEOUT), LOGGER);
            TimeUnit.SECONDS.sleep(CONFIG_RESTART_TIMEOUT);
            List<String> services = IOUtils.readLines(Objects.requireNonNull(getClass()
                            .getResourceAsStream("/registered-services.txt")),
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

    private void addRepoService(String filename, List<String> repoServices) {
        StringBuilder sb = new StringBuilder("(&(objectClass=com.mobi.repository.api.OsgiRepository)"
                + "(component.name=");
        sb.append(filename, 0, filename.indexOf("-"));
        sb.append(")(id=");
        sb.append(filename, filename.indexOf("-") + 1, filename.indexOf(".cfg"));
        sb.append("))");
        repoServices.add(sb.toString());
    }

    /**
     * Clear All Repos.
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

    private void restoreRepositories(ObjectNode manifestRepos, Set<String> remoteRepos, String backupVersion,
                                     long batchSize)
            throws IOException {
        // Populate Repositories
        ImportServiceConfig.Builder builder = new ImportServiceConfig.Builder()
                .continueOnError(false)
                .logOutput(true)
                .printOutput(true)
                .batchSize(batchSize);

        for (Iterator<String> i = manifestRepos.fieldNames(); i.hasNext();) {
            String repoName = i.next();
            if (!remoteRepos.contains(repoName)) {
                String repoPath = manifestRepos.get(repoName).asText();
                String repoDirectoryPath = repoPath.substring(0, repoPath.lastIndexOf(repoName + ".zip"));
                File repoFile = new File(RESTORE_PATH + File.separator + repoDirectoryPath + File.separator
                        + repoName + ".trig");

                if (VersionRangeUtils.isPre4Version(backupVersion) && "system".equals(repoName)) {
                    repoName = "systemTemp";
                }
                builder.repository(repoName);
                long startTime = System.currentTimeMillis();
                importService.importFile(builder.build(), repoFile);
                long endTime = System.currentTimeMillis();
                RestoreUtils.out(String.format("Data successfully loaded to %s repository. Took %s ms", repoName,
                        endTime - startTime), LOGGER);
            } else {
                RestoreUtils.out("Skipping data load of remote repository " + repoName, LOGGER);
            }
        }
    }

    /**
     * Restore Pre-Process.
     *
     * @param backupVersion Backup Version
     * @throws EndRestoreException If an executed operation had non-recoverable error
     */
    private void restorePreProcess(String backupVersion) throws EndRestoreException {
        List<PreRestoreOperation> preRestoreOperations = preRestoreOperationHandler.getOperations(backupVersion);
        executeRestoreOperations(preRestoreOperations);
    }

    /**
     * Restore Process Post-processing.
     *
     * @param backupVersion Backup Version
     * @throws EndRestoreException If an executed operation had non-recoverable error
     */
    protected void restorePostProcess(String backupVersion) throws EndRestoreException {
        List<PostRestoreOperation> postRestoreOperations = postRestoreOperationHandler.getOperations(backupVersion);
        executeRestoreOperations(postRestoreOperations);
    }

    /**
     * Execute list of ExecutableRestoreOperation.
     *
     * @param executableRestoreOperation List of ExecutableRestore Operations
     * @throws EndRestoreException If an executed operation had non-recoverable error
     */
    private void executeRestoreOperations(List<? extends ExecutableRestoreOperation> executableRestoreOperation)
            throws EndRestoreException {
        executableRestoreOperation.forEach((ExecutableRestoreOperation operation) -> {
            try {
                long startTime = System.currentTimeMillis();
                operation.execute();
                long endTime = System.currentTimeMillis();
                RestoreUtils.out(String.format("Executed Operation %s with priority %s for versions %s, took %s ms",
                        operation.getClass(), operation.getPriority(), operation.getVersionRange(),
                        endTime - startTime), LOGGER);
            } catch (EndRestoreException e) {
                RestoreUtils.error(operation, e.getMessage(), e, LOGGER);
                throw e;
            } catch (Exception e) {
                RestoreUtils.error(operation, e.getMessage(), e, LOGGER);
            }
        });
    }
}
