package com.mobi.catalog.api.record;

/*-
 * #%L
 * com.mobi.catalog.api
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

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.RevisionManager;
import com.mobi.catalog.api.VersionManager;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.MasterBranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.RevisionFactory;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.api.record.config.VersionedRDFRecordExportSettings;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.persistence.utils.BatchGraphInserter;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.RDFFiles;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.eclipse.rdf4j.common.transaction.IsolationLevels;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.util.RDFLoader;
import org.eclipse.rdf4j.rio.ParserConfig;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.Rio;
import org.osgi.service.component.annotations.Reference;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.Nonnull;

/**
 * Defines functionality for VersionedRDFRecordService. Provides common methods for exporting and deleting a Record.
 * Overrides exportRecord() and deleteRecord() to perform VersionedRDFRecord specific operations such as writing
 * out Branches, Commits, and Tags.
 *
 * @param <T> of VersionedRDFRecord
 */
public abstract class AbstractVersionedRDFRecordService<T extends VersionedRDFRecord>
        extends AbstractRecordService<T> implements RecordService<T> {
    private static final String USER_IRI_BINDING = "%USERIRI%";
    private static final String RECORD_IRI_BINDING = "%RECORDIRI%";
    private static final String ENCODED_RECORD_IRI_BINDING = "%RECORDIRIENCODED%";
    private static final String POLICY_IRI_BINDING = "%POLICYIRI%";
    private static final String ENCODED_POLICY_IRI_BINDING = "%POLICYIRIENCODED%";
    private static final String MASTER_BRANCH_IRI_BINDING = "%MASTER%";
    private static final String RECORD_NO_POLICY_QUERY;
    private static final String GET_GRAPHS_TO_DELETE;
    private static final String GET_COMMIT_PATHS;

    static {
        try {
            RECORD_NO_POLICY_QUERY = IOUtils.toString(
                    Objects.requireNonNull(AbstractVersionedRDFRecordService.class
                            .getResourceAsStream("/record-no-policy.rq")),
                    StandardCharsets.UTF_8
            );
            GET_GRAPHS_TO_DELETE = IOUtils.toString(
                    Objects.requireNonNull(AbstractVersionedRDFRecordService.class
                            .getResourceAsStream("/get-graphs-to-delete.rq")),
                    StandardCharsets.UTF_8
            );
            GET_COMMIT_PATHS = IOUtils.toString(
                    Objects.requireNonNull(AbstractVersionedRDFRecordService.class
                            .getResourceAsStream("/get-commit-paths.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    public CommitFactory commitFactory;

    @Reference
    public BranchFactory branchFactory;

    @Reference
    public MasterBranchFactory masterBranchFactory;

    @Reference
    public MergeRequestManager mergeRequestManager;

    @Reference
    public VersioningManager versioningManager;

    @Reference
    public CatalogConfigProvider configProvider;

    @Reference
    public EngineManager engineManager;

    @Reference
    public CommitManager commitManager;

    @Reference
    public VersionManager versionManager;

    @Reference
    public BranchManager branchManager;

    @Reference
    public RecordManager recordManager;

    @Reference
    public DifferenceManager differenceManager;

    @Reference
    public RevisionManager revisionManager;

    @Reference
    public RevisionFactory revisionFactory;

    protected final ModelFactory mf = new DynamicModelFactory();

    @Override
    protected void exportRecord(T record, RecordOperationConfig config, RepositoryConnection conn) {
        BatchExporter exporter = config.get(RecordExportSettings.BATCH_EXPORTER);
        writeRecordData(record, exporter);
        if (config.get(VersionedRDFRecordExportSettings.WRITE_VERSIONED_DATA)) {
            writeVersionedRDFData(record, config.get(VersionedRDFRecordExportSettings.BRANCHES_TO_EXPORT),
                    exporter, conn);
        }
    }

    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        T record = createRecordObject(config, issued, modified);
        MasterBranch masterBranch = createMasterBranch(record);

        IRI catalogIdIRI = vf.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
        Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                new IllegalStateException("VersionedRDFRecord must have a master Branch"));

        File versionedRdf = null;
        InitialLoad initialLoad = null;
        try {
            // Initial revision contains uploaded data for queries/rebuilding if necessary
            versionedRdf = createDataFile(config);
            initialLoad = loadHeadGraph(masterBranch, user, versionedRdf);

            conn.begin();
            addRecord(record, masterBranch, conn);
            commitManager.addInProgressCommit(catalogIdIRI, record.getResource(), initialLoad.ipc, conn);

            Resource initialCommitIRI = versioningManager.commit(catalogIdIRI, record.getResource(), masterBranchId,
                    user, "The initial commit.", conn);
            Commit initialCommit = commitManager.getCommit(initialCommitIRI, conn).orElseThrow(
                    () -> new IllegalStateException("Could not retrieve commit " + initialCommitIRI.stringValue()));
            initialCommit.setInitialRevision(initialLoad.initialRevision);
            initialCommit.getModel().addAll(initialLoad.initialRevision.getModel());
            thingManager.updateObject(initialCommit, conn);

            conn.commit();
            writePolicies(user, record);
            versionedRdf.delete();
        } catch (Exception e) {
            Revision revision = null;
            if (initialLoad != null) {
                revision = initialLoad.initialRevision;
            }
            handleError(masterBranch, revision, versionedRdf, e);
        }
        return record;
    }

    /**
     * Creates a Model based on a {@link RecordOperationConfig}.
     *
     * @param config A {@link RecordOperationConfig} containing the Model or an InputStream to create a Model
     * @return parsed model
     */
    protected File createDataFile(RecordOperationConfig config) {
        String fileName = config.get(VersionedRDFRecordCreateSettings.FILE_NAME);
        InputStream inputStream = config.get(VersionedRDFRecordCreateSettings.INPUT_STREAM);
        File file;
        if (fileName != null && inputStream != null) {
            RDFFormat format = RDFFiles.getFormatForFileName(fileName)
                    .orElseThrow(() -> new IllegalArgumentException("Could not retrieve RDFFormat for file name "
                            + fileName));
            if (format.equals(RDFFormat.TRIG)) {
                throw new IllegalArgumentException("TriG data is not supported for upload.");
            }
            File tempFile = RDFFiles.writeStreamToTempFile(inputStream, format);
            if (RDFFiles.isOwlFile(tempFile)) {
                file = RDFFiles.parseFileToFileFormat(tempFile, RDFFormat.TURTLE);
            } else {
                file = tempFile;
            }
        } else if (config.get(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA) != null) {
            try {
                Path tmpFile = Files.createTempFile(null, ".ttl");
                Rio.write(config.get(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA), Files.newOutputStream(tmpFile), RDFFormat.TURTLE);
                file = tmpFile.toFile();
            } catch (IOException e) {
                throw new MobiException("Could not parse input stream.", e);
            }
        } else {
            throw new IllegalArgumentException("VersionedRDFRecord config does not have initial data.");
        }
        return file;
    }

    /**
     * Creates two policy files for the Record based on default templates. One policy to control who can view and modify
     * the Record. The other for who can modify the aforementioned policy.
     *
     * @param user   The User who created the Record and associated Policy files
     * @param record The Record the Policy files control
     */
    protected void writePolicies(User user, T record) {
        writePolicies(user.getResource(), record.getResource(), record.getMasterBranch_resource().get());
    }

    /**
     * Creates two policy files for the Record based on default templates. One policy to control who can view and modify
     * the Record. The other for who can modify the aforementioned policy.
     *
     * @param user           The Resource of the user who created the Record and associated Policy files
     * @param recordId       The Resource of the Record to write out
     * @param masterBranchId The Resource of the Master Branch associated with the recordId
     */
    protected void writePolicies(Resource user, Resource recordId, Resource masterBranchId) {
        // Record Policy
        Resource recordPolicyResource = writeRecordPolicy(user, recordId, masterBranchId);

        // Policy for the Record Policy
        writeRecordPolicyPolicy(user, recordId, recordPolicyResource);
    }

    /**
     * Creates a policy file based on default templates that controls who can view and modify the Record.
     *
     * @param user           The Resource of the user who created the Record and associated Policy files
     * @param recordId       The Resource of the Record to write out
     * @param masterBranchId The Resource of the Master Branch associated with the recordId
     */
    protected Resource writeRecordPolicy(Resource user, Resource recordId, Resource masterBranchId) {
        Path recordPolicyPath = Paths.get(System.getProperty("karaf.etc") + File.separator + "policies"
                + File.separator + "policyTemplates" + File.separator + "recordPolicy.xml");
        try (InputStream data = Files.newInputStream(recordPolicyPath)){
            String recordPolicy = new String(data.readAllBytes(), StandardCharsets.UTF_8);
            String encodedRecordIRI = ResourceUtils.encode(recordId);
            String[] search = {USER_IRI_BINDING, RECORD_IRI_BINDING, ENCODED_RECORD_IRI_BINDING,
                    MASTER_BRANCH_IRI_BINDING};
            String[] replace = {user.stringValue(), recordId.stringValue(), encodedRecordIRI,
                    masterBranchId.stringValue()};
            recordPolicy = StringUtils.replaceEach(recordPolicy, search, replace);

            return addPolicy(recordPolicy);
        } catch (IOException e) {
            throw new MobiException("Error writing record policy.", e);
        }
    }

    /**
     * Creates a policy file based on default templates that controls who can modify the policy for the Record.
     *
     * @param user                 The Resource of the user who created the Record and associated Policy files
     * @param recordId             The Resource of the Record to write out
     * @param recordPolicyResource The Resource of the Record policy
     */
    protected void writeRecordPolicyPolicy(Resource user, Resource recordId, Resource recordPolicyResource) {
        String encodedRecordIRI = ResourceUtils.encode(recordId);
        String[] search = {USER_IRI_BINDING, POLICY_IRI_BINDING, ENCODED_POLICY_IRI_BINDING};
        String[] replace = {user.stringValue(), recordPolicyResource.stringValue(), encodedRecordIRI};
        Path policyPolicyPath = Paths.get(System.getProperty("karaf.etc") + File.separator + "policies"
                + File.separator + "policyTemplates" + File.separator + "policyPolicy.xml");
        try (InputStream data = Files.newInputStream(policyPolicyPath)){
            String policyPolicy = new String(data.readAllBytes(), StandardCharsets.UTF_8);
            policyPolicy = StringUtils.replaceEach(policyPolicy, search, replace);
            addPolicy(policyPolicy);
        } catch (IOException e) {
            throw new MobiException("Error writing record policy.", e);
        }
    }

    /**
     * Uses the {@link XACMLPolicyManager} to add the Policy file to the repository and virtual filesystem.
     *
     * @param policyString A string representation of a policy
     * @return The {@link Resource} of the new Policy
     */
    protected Resource addPolicy(String policyString) {
        XACMLPolicy policy = new XACMLPolicy(policyString, vf);
        return xacmlPolicyManager.addPolicy(policy);
    }

    /**
     * Adds the record and masterBranch to the repository.
     *
     * @param record       The VersionedRDFRecord to add to the repository
     * @param masterBranch The initialized masterBranch to add to the repository
     * @param conn         A RepositoryConnection to use for lookup
     */
    protected void addRecord(T record, Branch masterBranch, RepositoryConnection conn) {
        thingManager.addObject(record, conn);
        thingManager.addObject(masterBranch, conn);
    }

    /**
     * Creates a MasterBranch to be initialized based on (record, conn) from the repository.
     *
     * @param record The VersionedRDFRecord to add to a MasterBranch
     */
    protected MasterBranch createMasterBranch(VersionedRDFRecord record) {
        MasterBranch branch = createBranch("MASTER", "The master branch.");
        Optional<Value> publisher = record.getProperty(vf.createIRI(_Thing.publisher_IRI));
        branch.setProperty(publisher.get(), vf.createIRI(_Thing.publisher_IRI));
        record.setMasterBranch(branch);
        Set<Branch> branches = record.getBranch_resource().stream()
                .map(branchFactory::createNew)
                .collect(Collectors.toSet());
        branches.add(branch);
        record.setBranch(branches);
        String headGraph = record.getResource().stringValue() + "/HEAD";
        branch.setHeadGraph(vf.createIRI(headGraph));
        return branch;
    }

    /**
     * Creates a branch specific to (title, description, factory).
     *
     * @param title       Name of desired branch
     * @param description Short description of the title branch
     */
    protected MasterBranch createBranch(@Nonnull String title, String description) {
        OffsetDateTime now = OffsetDateTime.now();

        MasterBranch branch = masterBranchFactory.createNew(vf.createIRI(Catalogs.BRANCH_NAMESPACE + UUID.randomUUID()));
        branch.setProperty(vf.createLiteral(title), vf.createIRI(_Thing.title_IRI));
        branch.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        branch.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
        if (description != null) {
            branch.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI));
        }
        return branch;
    }

    @Override
    protected void deleteRecord(T record, RepositoryConnection conn) {
        deleteVersionedRDFData(record, conn);
        deleteRecordObject(record, conn);
        deletePolicies(record, conn);
    }

    @Override
    public Optional<List<Resource>> deleteBranch(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                       RepositoryConnection conn) {
        T record = recordManager.getRecord(catalogId, versionedRDFRecordId, recordFactory, conn);
        Branch branch = branchManager.getBranch(record, branchId, branchFactory, conn);
        IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
        if (ConnectionUtils.contains(conn, versionedRDFRecordId, masterBranchIRI, branchId, versionedRDFRecordId)) {
            throw new IllegalStateException("Branch " + branchId + " is the master Branch and cannot be removed.");
        }
        conn.begin();
        record.setProperty(vf.createLiteral(OffsetDateTime.now()), vf.createIRI(_Thing.modified_IRI));
        thingManager.updateObject(record, conn);
        List<Resource> deletedCommits = removeBranch(versionedRDFRecordId, branch, conn);
        mergeRequestManager.cleanMergeRequests(versionedRDFRecordId, branchId, getBranchTitle(branch),
                deletedCommits, conn);
        conn.commit();
        return Optional.of(deletedCommits);
    }

    /**
     * Deletes VersionedRDFRecord specific data (Branches, Commits, Tags, InProgressCommits) from the repository.
     *
     * @param record The VersionedRDFRecord to delete
     * @param conn   A RepositoryConnection to use for lookup
     */
    protected void deleteVersionedRDFData(T record, RepositoryConnection conn) {
        mergeRequestManager.deleteMergeRequestsWithRecordId(record.getResource(), conn);
        record.getVersion_resource().forEach(resource -> versionManager.removeVersion(record.getResource(),
                resource, conn));

        Resource recordIri = record.getResource();
        TupleQuery getGraphsQuery = conn.prepareTupleQuery(GET_GRAPHS_TO_DELETE);
        getGraphsQuery.setBinding("recordId", recordIri);
        getGraphsQuery.evaluate().forEach(bindingSet -> {
            Resource graph = Bindings.requiredResource(bindingSet, "graph");
            conn.clear(graph);
        });
        Set<Resource> inProgressCommitIris = new HashSet<>();
        conn.getStatements(null, vf.createIRI(InProgressCommit.onVersionedRDFRecord_IRI), recordIri)
                .forEach(result -> inProgressCommitIris.add(result.getSubject()));
        inProgressCommitIris.forEach(resource -> {
            InProgressCommit commit = commitManager.getInProgressCommit(configProvider.getLocalCatalogIRI(), recordIri,
                    resource, conn);
            commitManager.removeInProgressCommit(commit, conn);
        });
    }

    /**
     * Writes the VersionedRDFRecord data (Branches, Commits, Tags) to the provided ExportWriter
     * If the provided branchesToWrite is empty, will write out all branches.
     *
     * @param record          The VersionedRDFRecord to write versioned data
     * @param branchesToWrite The Set of Resources identifying branches to write out
     * @param exporter        The ExportWriter to write the VersionedRDFRecord to
     * @param conn            A RepositoryConnection to use for lookup
     */
    protected void writeVersionedRDFData(VersionedRDFRecord record, Set<Resource> branchesToWrite,
                                         BatchExporter exporter, RepositoryConnection conn) {
        Set<Resource> processedCommits = new HashSet<>();

        // Write Branches
        record.getBranch_resource().forEach(branchResource -> {
            if (branchesToWrite.isEmpty() || branchesToWrite.contains(branchResource)) {
                Branch branch = branchManager.getBranch(record, branchResource, branchFactory, conn);
                branch.getModel().forEach(exporter::handleStatement);
                Resource headIRI = commitManager.getHeadCommitIRI(branch);

                // Write Commits
                for (Resource commitId : commitManager.getCommitChain(headIRI, false, conn)) {

                    if (processedCommits.contains(commitId)) {
                        break;
                    } else {
                        processedCommits.add(commitId);
                    }

                    // Write Commit/Revision Data
                    Commit commit = thingManager.getExpectedObject(commitId, commitFactory, conn);
                    commit.getModel().forEach(exporter::handleStatement);

                    // Write Additions/Deletions Graphs
                    Revision revision = revisionManager.getRevision(commitId, conn);
                    revision.getAdditions().ifPresentOrElse(graph -> {
                        conn.getStatements(null, null, null, graph).forEach(exporter::handleStatement);
                    }, () -> new IllegalStateException("No Additions Graph IRI found"));
                    revision.getDeletions().ifPresentOrElse(graph -> {
                        conn.getStatements(null, null, null, graph).forEach(exporter::handleStatement);
                    }, () -> new IllegalStateException("No Deletions Graph IRI found"));
                }
            }
        });
    }

    protected void checkForMissingPolicies() {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(RECORD_NO_POLICY_QUERY);
            TupleQueryResult result = query.evaluate();

            while (result.hasNext()) {
                BindingSet bindings = result.next();
                Optional<Binding> recordBinding = Optional.ofNullable(bindings.getBinding("record"));
                Optional<Binding> masterBinding = Optional.ofNullable(bindings.getBinding("master"));
                Optional<Binding> publisherBinding = Optional.ofNullable(bindings.getBinding("publisher"));
                if (recordBinding.isPresent() && masterBinding.isPresent() && publisherBinding.isPresent()) {
                    IRI recordIRI = vf.createIRI(recordBinding.get().getValue().stringValue());
                    IRI masterIRI = vf.createIRI(masterBinding.get().getValue().stringValue());
                    IRI userIRI = vf.createIRI(publisherBinding.get().getValue().stringValue());

                    String username = engineManager.getUsername(userIRI).orElse("admin");
                    engineManager.retrieveUser(username).ifPresent(user -> writePolicies(user.getResource(), recordIRI,
                            masterIRI));
                }
            }
        }
    }

    protected InitialLoad loadHeadGraph(MasterBranch masterBranch, User user, File additionsFile) {
        InProgressCommit inProgressCommit = commitManager.createInProgressCommit(user);
        Revision initialRevision = revisionManager.createRevision(UUID.randomUUID());
        IRI initRevAddGraph = initialRevision.getAdditions().orElseThrow(
                () -> new IllegalStateException("Initial revision missing additions graph"));
        try (RepositoryConnection fileConn = configProvider.getRepository().getConnection()) {
            if (additionsFile != null) {
                RDFFormat format = RDFFiles.getFormatForFileName(additionsFile.getName()).orElseThrow(
                        () -> new IllegalStateException("File does not have valid extension"));
                IRI headGraph = branchManager.getHeadGraph(masterBranch);
                BatchGraphInserter inserter = new BatchGraphInserter(fileConn,
                        IsolationLevels.READ_UNCOMMITTED, headGraph, initRevAddGraph);
                RDFLoader loader = new RDFLoader(new ParserConfig(), vf);
                loader.load(additionsFile, null, format, inserter);

                additionsFile.delete();
            }
            return new InitialLoad(inProgressCommit, initialRevision);
        } catch (Exception e) {
            clearHeadGraph(masterBranch, initialRevision);
            throw new MobiException(e);
        }
    }

    protected record InitialLoad(InProgressCommit ipc, Revision initialRevision) {}

    protected void handleError(MasterBranch masterBranch, Revision initialRevision, File file, Exception e) {
        if (masterBranch != null) {
            clearHeadGraph(masterBranch, initialRevision);
        }
        if (e.getCause() instanceof RDFParseException && file != null) {
            String format = RDFFiles.getFormatForFileName(file.getName())
                    .orElseThrow(() -> new IllegalStateException("File has no format")).getName();
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("Error parsing format: %s.", format, " ,"));
            sb.append(Models.ERROR_OBJECT_DELIMITER);
            sb.append(format);
            sb.append(": ");
            sb.append(e.getCause().getMessage());
            throw new RDFParseException(sb.toString());
        }
        if (e instanceof RuntimeException) {
            throw (RuntimeException) e;
        } else {
            throw new MobiException(e);
        }
    }

    protected void clearHeadGraph(MasterBranch masterBranch, Revision initialRevision) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            IRI headGraph = branchManager.getHeadGraph(masterBranch);

            if (initialRevision == null) {
                conn.remove((IRI) null, null, null, headGraph);
                return;
            }

            IRI initRevAddGraph = initialRevision.getAdditions().orElseThrow(
                    () -> new IllegalStateException("Initial revision missing additions graph"));
            IRI initRevDelGraph = initialRevision.getDeletions().orElseThrow(
                    () -> new IllegalStateException("Initial revision missing deletions graph"));
            conn.remove((IRI) null, null, null, headGraph, initRevAddGraph, initRevDelGraph);
            conn.remove(initialRevision.getResource(), null, null);
        }
    }

    protected List<Resource> removeBranch(Resource recordId, Branch branch, RepositoryConnection conn) {
        List<Resource> deletedCommits = new ArrayList<>();
        thingManager.removeObjectWithRelationship(branch.getResource(), recordId, VersionedRDFRecord.branch_IRI, conn);
        Optional<Resource> headCommit = branch.getHead_resource();
        if (headCommit.isPresent()) {
            // Explicitly remove this so algorithm works for head commit
            conn.remove(branch.getResource(), vf.createIRI(Branch.head_IRI), headCommit.get());
            IRI commitIRI = vf.createIRI(Tag.commit_IRI);
            Set<Resource> deltaIRIs = new HashSet<>();
            getCommitPaths(headCommit.get(), conn).forEach(path -> {
                for (Resource commitId : path) {
                    if (!deletedCommits.contains(commitId)) {
                        if (!commitIsReferenced(commitId, deletedCommits, conn)) {
                            // Get Additions/Deletions Graphs
                            Set<Revision> revisions = revisionManager.getAllRevisionsFromCommitId(commitId, conn);
                            revisions.forEach(revision -> {
                                revision.getAdditions().ifPresent(deltaIRIs::add);
                                revision.getDeletions().ifPresent(deltaIRIs::add);
                                revision.getGraphRevision().forEach(graphRevision -> {
                                    graphRevision.getAdditions().ifPresent(deltaIRIs::add);
                                    graphRevision.getDeletions().ifPresent(deltaIRIs::add);
                                });
                            });

                            // Remove Commit
                            thingManager.remove(commitId, conn);

                            // Remove Tags Referencing this Commit
                            Set<Resource> tags = QueryResults.asModel(
                                    conn.getStatements(null, commitIRI, commitId), mf).subjects();
                            tags.forEach(tagId -> thingManager.removeObjectWithRelationship(tagId, recordId,
                                    VersionedRecord.version_IRI, conn));
                            deletedCommits.add(commitId);
                        } else {
                            break;
                        }
                    }
                }
            });
            deltaIRIs.forEach(resource -> thingManager.remove(resource, conn));
        }
        return deletedCommits;
    }

    private List<List<Resource>> getCommitPaths(Resource commitId, RepositoryConnection conn) {
        List<List<Resource>> rtn = new ArrayList<>();
        TupleQuery query = conn.prepareTupleQuery(GET_COMMIT_PATHS);
        query.setBinding("start", commitId);
        try (TupleQueryResult result = query.evaluate()) {
            result.forEach(bindings -> {
                String[] path = StringUtils.split(Bindings.requiredLiteral(bindings, "path").stringValue(), " ");
                assert path != null;
                Optional<Binding> parent = Optional.ofNullable(bindings.getBinding("parent"));
                if (parent.isEmpty()) {
                    rtn.add(Stream.of(path).map(vf::createIRI).collect(Collectors.toList()));
                } else {
                    String[] connectPath = StringUtils.split(
                            Bindings.requiredLiteral(bindings, "connectPath").stringValue(), " ");
                    rtn.add(Stream.of(connectPath, path).flatMap(Stream::of).map(vf::createIRI)
                            .collect(Collectors.toList()));
                }
            });
        }
        return rtn;
    }

    private boolean commitIsReferenced(Resource commitId, List<Resource> deletedCommits, RepositoryConnection conn) {
        IRI headCommitIRI = vf.createIRI(Branch.head_IRI);
        IRI baseCommitIRI = vf.createIRI(Commit.baseCommit_IRI);
        IRI branchCommitIRI = vf.createIRI(Commit.branchCommit_IRI);
        IRI auxiliaryCommitIRI = vf.createIRI(Commit.auxiliaryCommit_IRI);

        boolean isHeadCommit = ConnectionUtils.contains(conn, null, headCommitIRI, commitId);
        boolean isParent = Stream.of(baseCommitIRI, branchCommitIRI, auxiliaryCommitIRI)
                .map(iri -> {
                    List<Resource> temp = new ArrayList<>();
                    conn.getStatements(null, iri, commitId).forEach(statement -> temp.add(statement.getSubject()));
                    temp.removeAll(deletedCommits);
                    return !temp.isEmpty();
                })
                .reduce(false, (iri1, iri2) -> iri1 || iri2);
        return isHeadCommit || isParent;
    }

    private String getBranchTitle(Branch branch) {
        return branch.getProperty(vf.createIRI(_Thing.title_IRI)).orElseThrow(() ->
                new IllegalStateException("Branch " + branch.getResource() + " does not have a title")).stringValue();
    }
}
