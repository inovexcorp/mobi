package com.mobi.utils.cli;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.record.DatasetRecordService;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.platform.config.api.ontologies.platformconfig.State;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryConfig;
import com.mobi.repository.impl.sesame.nativestore.NativeRepositoryConfig;
import com.mobi.security.api.EncryptionService;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import com.mobi.vfs.ontologies.documents.BinaryFile;
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
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.apache.karaf.system.SystemService;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.InvalidSyntaxException;
import org.osgi.framework.ServiceReference;
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
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Command(scope = "mobi", name = "restore", description = "Restores Mobi backup and will handle migration if versions "
        +  "differ")
@Service
public class Restore implements Action {

    private static final Logger LOGGER = LoggerFactory.getLogger(Restore.class);

    private static final String CLEAN_DANGLING_ADDITIONS_DELETIONS;
    private static final String CLEAR_INPROGRESS_COMMIT_NO_RECORD;
    private static final String CLEAR_INPROGRESS_COMMIT_NO_USER;
    private static final String SEARCH_STATE_INSTANCES_NO_USER;
    private static final String CLEAR_POLICY_STATEMENTS;
    private static final String FIND_DATASET_NO_POLICIES;

    static {
        try {
            CLEAN_DANGLING_ADDITIONS_DELETIONS = IOUtils.toString(
                    Restore.class.getResourceAsStream("/clearDanglingAdditionsDeletions.rq"),
                    StandardCharsets.UTF_8
            );
            CLEAR_INPROGRESS_COMMIT_NO_RECORD = IOUtils.toString(
                    Restore.class.getResourceAsStream("/clearInProgressCommitNoRecord.rq"),
                    StandardCharsets.UTF_8
            );
            CLEAR_INPROGRESS_COMMIT_NO_USER = IOUtils.toString(
                    Restore.class.getResourceAsStream("/clearInProgressCommitNoUser.rq"),
                    StandardCharsets.UTF_8
            );
            SEARCH_STATE_INSTANCES_NO_USER = IOUtils.toString(
                    Restore.class.getResourceAsStream("/searchStateInstanceNoUser.rq"),
                    StandardCharsets.UTF_8
            );
            CLEAR_POLICY_STATEMENTS = IOUtils.toString(
                    Restore.class.getResourceAsStream("/clearPolicyStatements.rq"),
                    StandardCharsets.UTF_8
            );
            FIND_DATASET_NO_POLICIES = IOUtils.toString(
                    Restore.class.getResourceAsStream("/findDatasetNoPolicy.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    private final ValueFactory vf = new ValidatingValueFactory();

    private static final String RESTORE_PATH = System.getProperty("java.io.tmpdir") + File.separator + "restoreZip";
    public static final String CONFIG_PATH = RESTORE_PATH + File.separator + "configurations";
    public static final String MANIFEST_FILE = RESTORE_PATH + File.separator + "manifest.json";
    private final List<String> mobiVersions = Arrays.asList("1.12", "1.13", "1.14", "1.15", "1.16", "1.17",
            "1.18", "1.19", "1.20", "1.21", "1.22", "2.0", "2.1");
    private final List<String> POLICES_TO_REMOVE = Arrays.asList(
            "http://mobi.com/policies/system-repo-access",
            "http://mobi.com/policies/all-access-versioned-rdf-record",
            "http://mobi.com/policies/dataset-creation",
            "http://mobi.com/policies/ontology-creation",
            "http://mobi.com/policies/shapes-graph-record-creation",
            "http://mobi.com/policies/publish",
            "http://mobi.com/policies/sync");
    
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
    private EncryptionService encryptionService;

    @Reference
    protected CatalogConfigProvider config;

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
        try {
            unzipFile(backupFilePath, RESTORE_PATH);
        } catch (IOException e) {
            error("Error unzipping backup file: " + e.getMessage(), e);
            return null;
        }
        JSONObject manifest;
        JSONObject manifestRepos;
        try {
            String manifestStr = new String(Files.readAllBytes(Paths.get(MANIFEST_FILE)));
            manifest = JSONObject.fromObject(manifestStr);
            manifestRepos = manifest.optJSONObject("repositories");
        } catch (IOException e) {
            error("Error loading manifest file: " + e.getMessage(), e);
            return null;
        }

        String fullBackupVer = manifest.optString("version");
        if (StringUtils.isEmpty(fullBackupVer)) {
            error("Manifest must contain the Mobi 'version' identifier of backup");
            return null;
        }
        Pattern versionPattern = Pattern.compile("([0-9]+\\.[0-9]+)");
        Matcher matcher = versionPattern.matcher(fullBackupVer);
        if (!matcher.find()) {
            error("Mobi version in manifest must match regex pattern [0-9]+\\\\.[0-9]+");
            return null;
        }
        String backupVersion = matcher.group(1);
        if (!mobiVersions.contains(backupVersion)) {
            error("A valid version of Mobi is required (" + String.join(".*, ", mobiVersions) + ".*).");
            return null;
        }

        // Copy Configs, Copy Policies, Clear Repos, Restore Repos
        BundleContext xacmlBundleContext = FrameworkUtil.getBundle(XACMLPolicyManager.class).getBundleContext();
        copyConfigFiles(xacmlBundleContext, backupVersion);
        copyPolicyFiles(xacmlBundleContext, backupVersion);
        Set<String> remoteRepos = clearAllRepos(repositoryManager);
        restoreRepositories(manifestRepos, remoteRepos);
        restorePostProcess(xacmlBundleContext, backupVersion);

        // Clear temp restore folder
        File tempArchive = new File(RESTORE_PATH);
        tempArchive.delete();

        // Restart XACMLPolicyManager bundle - recreate policies that were deleted
        out("Restarting XACMLPolicyManager bundle");
        long start = System.currentTimeMillis();
        xacmlBundleContext.getBundle().update();
        out("Restarted XACMLPolicyManager bundle. Took:" + (System.currentTimeMillis() - start)+ " ms");

        out("Restarting all services");
        systemService.reboot();
        return null;
    }

    private void copyConfigFiles(BundleContext bundleContext, String version) throws IOException, InterruptedException,
            InvalidSyntaxException {
        try {
            // Copy config files to karaf.etc directory
            List<String> repoServices = new ArrayList<>();
            File configDir = new File(CONFIG_PATH);

            // Generate list of repoServices from the repository configuration filenames in the the backup
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
            if (mobiVersions.indexOf(version) < mobiVersions.indexOf("2.0")) {
                LOGGER.trace("Version lower than 2.0 detected. Blacklisting additional files from backup.");
                // Blacklist karaf org.ops4j.pax.web.cfg file due to Karaf 4.4 upgrade to Pax Web 8 which removed
                // deprecated properties
                blacklistedFiles.add("org.ops4j.pax.web.cfg");
            }

            // Merge directories, replacing any file that already exists
            Path src = Paths.get(RESTORE_PATH + File.separator + "configurations" + File.separator);
            Path dest = Paths.get(System.getProperty("karaf.etc") + File.separator);
            if (encryptionService != null) {
                encryptionService.disable();
            }
            Files.walk(src).forEach(backupConfig -> {
                try {
                    boolean isSystemPolicy = containsSubPath(backupConfig, Paths.get("policies/systemPolicies"));
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

            System.out.println("Waiting for services to restart after copying config files");
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
        } catch (Exception e) {
            if (encryptionService != null) {
                encryptionService.enable();
            }
            throw e;
        }
    }

    private boolean containsSubPath(Path someRealPath, Path subPathToCheck) {
        return someRealPath.normalize()
                .toString()
                .contains(subPathToCheck.normalize()
                        .toString());
    }

    /**
     * Copy policy files to proper destination. Directory contains all policies for runtime.
     * @param bundleContext XamclPolicyManager bundleContext
     * @param backupVersion backup versoin
     * @throws IOException
     */
    private void copyPolicyFiles(BundleContext bundleContext, String backupVersion) throws IOException {
        if (!backupVersion.startsWith(mobiVersions.get(0))) {
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
    }

    /**
     * Clear All Repos
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

    private void restoreRepositories(JSONObject manifestRepos, Set<String> remoteRepos)
            throws IOException {
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
                importService.importFile(builder.build(), repoFile);
                out("Data successfully loaded to " + repoName + " repository.");
            } else {
                out("Skipping data load of remote repository " + repoName);
            }
        }
    }

    /**
     * Post processing of restore process
     * @param xacmlBundleContext xacmlBundleContext
     * @param backupVersion backupVersion
     */
    protected void restorePostProcess(BundleContext xacmlBundleContext, String backupVersion) {
        try (RepositoryConnection conn = config.getRepository().getConnection()) {
            cleanCatalogRepo(conn, backupVersion);
            cleanPolicies(conn, backupVersion, xacmlBundleContext);
        }
    }

    private void cleanCatalogRepo(RepositoryConnection conn, String backupVersion) {
        LOGGER.trace("Remove All In progress Commits where User doesn’t exist");
        conn.prepareUpdate(CLEAR_INPROGRESS_COMMIT_NO_USER).execute();

        LOGGER.trace("Remove In Progress Commits where Record doesn’t exist");
        conn.prepareUpdate(CLEAR_INPROGRESS_COMMIT_NO_RECORD).execute();

        LOGGER.trace("Remove Addition and Deletion Graphs with no Revision");
        conn.prepareUpdate(CLEAN_DANGLING_ADDITIONS_DELETIONS).execute();

        LOGGER.trace("Remove State instances where User doesn’t exist");
        TupleQueryResult results = conn.prepareTupleQuery(SEARCH_STATE_INSTANCES_NO_USER).evaluate();
        results.forEach(bindingSet -> stateManager.deleteState(Bindings.requiredResource(bindingSet, "state")));

        if (mobiVersions.indexOf(backupVersion) < 2) {
            // Clear ontology editor state
            RepositoryResult<Statement> stateResults = conn.getStatements(null,
                    vf.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), vf.createIRI(State.TYPE));
            stateResults.forEach(statement -> stateManager.deleteState(statement.getSubject()));
            LOGGER.trace("Remove state statements");
        }
    }

    private void cleanPolicies(RepositoryConnection conn, String backupVersion, BundleContext bundleContext) {
        if (mobiVersions.indexOf(backupVersion) < 10) {
            LOGGER.trace("Remove old versions of admin policy and system repo query policy");
            // 1.20 changed admin policy and system repo query policy. Need to remove old versions so updated
            // policy takes effect.
            List<Resource> policiesToRemove = POLICES_TO_REMOVE.stream().map(iri -> vf.createIRI(iri))
                    .collect(Collectors.toList());
            ServiceReference<XACMLPolicyManager> service =
                    bundleContext.getServiceReference(XACMLPolicyManager.class);
            String policyFileLocation = (String) service.getProperty("policyFileLocation");
            removePolicyFiles(bundleContext, conn, policyFileLocation, policiesToRemove);
        }

        createDatesetPolicies(bundleContext);

        LOGGER.trace("Remove PolicyFile statements");
        conn.prepareUpdate(CLEAR_POLICY_STATEMENTS).execute();
    }

    /**
     * Get a list of Dataset Records that do not have policies
     * @param conn RepositoryConnection
     * @return  List<Resource> Dataset Resources
     */
    protected List<Resource> getDatasetNoPolicyResources(RepositoryConnection conn) {
        List<Resource> datasetResources = new ArrayList<>();
        TupleQueryResult results = conn.prepareTupleQuery(FIND_DATASET_NO_POLICIES).evaluate();
        results.forEach(bindingSet -> datasetResources.add(Bindings.requiredResource(bindingSet, "datasetRecord")));
        return datasetResources;
    }

    /**
     * Create Dataset Policies for datasets that do not have polices.
     *
     * Steps:
     * - Find all dataset records that does not have policies
     * - Create dataset policies for those records
     *
     */
    protected void createDatesetPolicies(BundleContext bundleContext) {
        List<Resource> datasetResources;
        try (RepositoryConnection conn = config.getRepository().getConnection()) {
            datasetResources = getDatasetNoPolicyResources(conn);
        }
        out("There are " + datasetResources.size() + " dataset records without policies");
        LOGGER.trace("Records: " + datasetResources.toString());

        ServiceReference<DatasetManager> serviceReference = bundleContext
                .getServiceReference(DatasetManager.class);
        DatasetManager datasetManager = bundleContext.getService(serviceReference);

        ServiceReference<DatasetRecordService> datasetRecordServiceRef = bundleContext
                .getServiceReference(DatasetRecordService.class);
        DatasetRecordService datasetRecordService = bundleContext.getService(datasetRecordServiceRef);

        List<DatasetRecord> datasetRecords = datasetResources.stream()
                .map(resource -> datasetManager.getDatasetRecord(resource))
                .filter(datasetRecord -> datasetRecord.isPresent())
                .map(datasetRecordOptional -> datasetRecordOptional.get())
                .collect(Collectors.toList());

        for (DatasetRecord datasetRecord : datasetRecords) {
            datasetRecordService.overwritePolicyDefault(datasetRecord);
        }
    }

    /**
     * Finds old policy file locations for the provided files in the repo (may point to a non-existent directory), grabs
     * the hash path, finds the File in the new location on this instance using the policyFileLocation and VFS, and
     * deletes the File if it exists.
     * @param bundleContext the OSGI {@link BundleContext} used to retrieve services.
     * @param conn the {@link RepositoryConnection} used to query the repo for retrievalUrls.
     * @param policyFileLocation the policyFileLocation for the current instance.
     * @param policies the List of IRIs of policies whose files should be removed.
     */
    protected void removePolicyFiles(BundleContext bundleContext, RepositoryConnection conn, String policyFileLocation,
                                     List<Resource> policies) {
        ServiceReference<VirtualFilesystem> vfsService = bundleContext.getServiceReference(VirtualFilesystem.class);
        VirtualFilesystem vfs = bundleContext.getService(vfsService);

        for (Resource policy : policies) {
            RepositoryResult<Statement> results = conn.getStatements(policy,
                    vf.createIRI(BinaryFile.retrievalURL_IRI), null);
            results.forEach(statement -> {
                String path = statement.getObject().stringValue();
                Pattern pathPattern = Pattern.compile("([\\/|\\\\]\\w+){3}$");
                Matcher matcher = pathPattern.matcher(path);
                if (matcher.find()) {
                    String vfsFilePath = policyFileLocation + matcher.group().substring(1);
                    try {
                        VirtualFile file = vfs.resolveVirtualFile(vfsFilePath);
                        if (file.exists()) {
                            file.delete();
                        }
                    } catch (VirtualFilesystemException e) {
                        LOGGER.error("Could not find vfs file: " + vfsFilePath);
                    }
                }
            });
        }
    }

    /**
     * Unzip archive into temp directory
     * @param filePath file to unzip
     * @param destination directory
     * @throws IOException
     */
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

    private void out(String msg){
        LOGGER.trace(msg);
        System.out.println(msg);
    }

    private void error(String msg){
        LOGGER.error(msg);
        System.out.println(msg);
    }

    private void error(String msg, Exception e){
        LOGGER.error(msg, e);
        System.out.println(msg);
    }
}
