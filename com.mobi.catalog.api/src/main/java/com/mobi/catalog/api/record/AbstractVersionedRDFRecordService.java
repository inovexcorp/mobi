package com.mobi.catalog.api.record;

/*-
 * #%L
 * com.mobi.catalog.api
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

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.RevisionFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
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
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;
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
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
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

    static {
        try {
            RECORD_NO_POLICY_QUERY = IOUtils.toString(
                    AbstractVersionedRDFRecordService.class.getResourceAsStream("/record-no-policy.rq"),
                    StandardCharsets.UTF_8
            );
            GET_GRAPHS_TO_DELETE = IOUtils.toString(
                    AbstractVersionedRDFRecordService.class.getResourceAsStream("/get-graphs-to-delete.rq"),
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
    public MergeRequestManager mergeRequestManager;

    @Reference
    public VersioningManager versioningManager;

    @Reference
    public CatalogConfigProvider configProvider;

    @Reference
    public EngineManager engineManager;

    @Reference
    public CatalogManager catalogManager;

    @Reference
    public RevisionFactory revisionFactory;

    final ValueFactory vf = new ValidatingValueFactory();

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
        Branch masterBranch = createMasterBranch(record);
        conn.begin();
        addRecord(record, masterBranch, conn);
        IRI catalogIdIRI = valueFactory.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
        Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                new IllegalStateException("VersionedRDFRecord must have a master Branch"));

        File versionedRdf = createDataFile(config);
        catalogManager.createInProgressCommit(catalogIdIRI, record.getResource(), user,
                versionedRdf, null, conn);
        versioningManager.commit(catalogIdIRI, record.getResource(), masterBranchId, user,
                "The initial commit.", conn);
        versionedRdf.delete();
        conn.commit();
        writePolicies(user, record);
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
        XACMLPolicy policy = new XACMLPolicy(policyString, valueFactory);
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
        utilsService.addObject(record, conn);
        utilsService.addObject(masterBranch, conn);
    }

    /**
     * Creates a MasterBranch to be initialized based on (record, conn) from the repository.
     *
     * @param record The VersionedRDFRecord to add to a MasterBranch
     */
    protected Branch createMasterBranch(VersionedRDFRecord record) {
        Branch branch = createBranch("MASTER", "The master branch.");
        Optional<Value> publisher = record.getProperty(valueFactory.createIRI(_Thing.publisher_IRI));
        branch.setProperty(publisher.get(), valueFactory.createIRI(_Thing.publisher_IRI));
        record.setMasterBranch(branch);
        Set<Branch> branches = record.getBranch_resource().stream()
                .map(branchFactory::createNew)
                .collect(Collectors.toSet());
        branches.add(branch);
        record.setBranch(branches);
        return branch;
    }

    /**
     * Creates a branch specific to (title, description, factory).
     *
     * @param title       Name of desired branch
     * @param description Short description of the title branch
     */
    protected Branch createBranch(@Nonnull String title, String description) {
        OffsetDateTime now = OffsetDateTime.now();

        Branch branch = branchFactory.createNew(valueFactory.createIRI(Catalogs.BRANCH_NAMESPACE + UUID.randomUUID()));
        branch.setProperty(valueFactory.createLiteral(title), valueFactory.createIRI(_Thing.title_IRI));
        branch.setProperty(valueFactory.createLiteral(now), valueFactory.createIRI(_Thing.issued_IRI));
        branch.setProperty(valueFactory.createLiteral(now), valueFactory.createIRI(_Thing.modified_IRI));
        if (description != null) {
            branch.setProperty(valueFactory.createLiteral(description), valueFactory.createIRI(_Thing.description_IRI));
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
        T record = utilsService.getRecord(catalogId, versionedRDFRecordId, recordFactory,
                conn);
        Branch branch = utilsService.getBranch(record, branchId, branchFactory, conn);
        IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
        if (ConnectionUtils.contains(conn, versionedRDFRecordId, masterBranchIRI, branchId, versionedRDFRecordId)) {
            throw new IllegalStateException("Branch " + branchId + " is the master Branch and cannot be removed.");
        }
        conn.begin();
        record.setProperty(vf.createLiteral(OffsetDateTime.now()), vf.createIRI(_Thing.modified_IRI));
        utilsService.updateObject(record, conn);
        List<Resource> deletedCommits = utilsService.removeBranch(versionedRDFRecordId, branch, conn);
        mergeRequestManager.cleanMergeRequests(versionedRDFRecordId, branchId, conn);
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
        record.getVersion_resource().forEach(resource -> utilsService.removeVersion(record.getResource(),
                resource, conn));

        Resource recordIri = record.getResource();
        TupleQuery getGraphsQuery = conn.prepareTupleQuery(GET_GRAPHS_TO_DELETE);
        getGraphsQuery.setBinding("recordId", recordIri);
        getGraphsQuery.evaluate().forEach(bindingSet -> {
            Resource graph = Bindings.requiredResource(bindingSet, "graph");
            conn.clear(graph);
        });
        Set<Resource> inProgressCommitIris = new HashSet<>();
        conn.getStatements(null, valueFactory.createIRI(InProgressCommit.onVersionedRDFRecord_IRI), recordIri)
                .forEach(result -> inProgressCommitIris.add(result.getSubject()));
        inProgressCommitIris.forEach(resource -> {
            InProgressCommit commit = utilsService.getInProgressCommit(configProvider.getLocalCatalogIRI(), recordIri,
                    resource, conn);
            utilsService.removeInProgressCommit(commit, conn);
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
                Branch branch = utilsService.getBranch(record, branchResource, branchFactory, conn);
                branch.getModel().forEach(exporter::handleStatement);
                Resource headIRI = utilsService.getHeadCommitIRI(branch);

                // Write Commits
                for (Resource commitId : utilsService.getCommitChain(headIRI, false, conn)) {

                    if (processedCommits.contains(commitId)) {
                        break;
                    } else {
                        processedCommits.add(commitId);
                    }

                    // Write Commit/Revision Data
                    Commit commit = utilsService.getExpectedObject(commitId, commitFactory, conn);
                    commit.getModel().forEach(exporter::handleStatement);

                    // Write Additions/Deletions Graphs
                    Difference revisionChanges = utilsService.getRevisionChanges(commitId, conn);
                    revisionChanges.getAdditions().forEach(exporter::handleStatement);
                    revisionChanges.getDeletions().forEach(exporter::handleStatement);
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
                    IRI recordIRI = valueFactory.createIRI(recordBinding.get().getValue().stringValue());
                    IRI masterIRI = valueFactory.createIRI(masterBinding.get().getValue().stringValue());
                    IRI userIRI = valueFactory.createIRI(publisherBinding.get().getValue().stringValue());

                    String username = engineManager.getUsername(userIRI).orElse("admin");
                    engineManager.retrieveUser(username).ifPresent(user -> writePolicies(user.getResource(), recordIRI,
                            masterIRI));
                }
            }
        }
    }

    protected InProgressCommit loadInProgressCommit(User user, File additionsFile) {
        InProgressCommit inProgressCommit = catalogManager.createInProgressCommit(user);
        IRI additionsGraph = getRevisionGraph(inProgressCommit, true);

        try (RepositoryConnection fileConn = configProvider.getRepository().getConnection()) {
            if (additionsFile != null) {
                RDFFormat format = RDFFiles.getFormatForFileName(additionsFile.getName()).orElseThrow(
                        () -> new IllegalStateException("File does not have valid extension"));
                BatchGraphInserter inserter = new BatchGraphInserter(fileConn, additionsGraph,
                        IsolationLevels.READ_UNCOMMITTED);
                RDFLoader loader = new RDFLoader(new ParserConfig(), valueFactory);
                loader.load(additionsFile, null, format, inserter);

                additionsFile.delete();
            }
            return inProgressCommit;
        } catch (Exception e) {
            clearAdditionsGraph(inProgressCommit);
            throw new MobiException(e);
        }
    }

    protected void handleError(InProgressCommit commit, File file, Exception e) {
        if (commit != null) {
            clearAdditionsGraph(commit);
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

    protected IRI getRevisionGraph(InProgressCommit inProgressCommit, boolean additions) {
        if (inProgressCommit == null) {
            throw new IllegalArgumentException("Cannot retrieve additions graph from empty commit");
        }
        Resource resource = inProgressCommit.getGenerated_resource().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Commit does not have a Revision."));
        Revision revision = revisionFactory.getExisting(resource, inProgressCommit.getModel())
                .orElseThrow(() -> new IllegalStateException("Could not retrieve expected Revision."));
        if (additions) {
            return revision.getAdditions().orElseThrow(() ->
                    new IllegalStateException("Additions not set on Commit " + inProgressCommit.getResource()));
        } else {
            return revision.getDeletions().orElseThrow(() ->
                    new IllegalStateException("Deletions not set on Commit " + inProgressCommit.getResource()));
        }
    }

    protected void clearAdditionsGraph(InProgressCommit inProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            conn.remove((IRI) null, null, null, getRevisionGraph(inProgressCommit, true));
        }
    }
}
