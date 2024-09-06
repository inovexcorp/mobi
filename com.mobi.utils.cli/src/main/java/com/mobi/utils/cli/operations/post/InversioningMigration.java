package com.mobi.utils.cli.operations.post;

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

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.RevisionManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.Models;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.utils.cli.api.PostRestoreOperation;
import com.mobi.utils.cli.utils.RestoreUtils;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.common.transaction.IsolationLevels;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.Update;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BasicParserSettings;
import org.eclipse.rdf4j.rio.helpers.TurtleWriterSettings;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component(
        service = { InversioningMigration.class, PostRestoreOperation.class }
)
public class InversioningMigration implements PostRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(InversioningMigration.class);

    private static final String RECORD_BINDING = "record";
    private static final String COMMIT_BINDING = "commit";
    private static final String NEW_COMMIT_BINDING = "newCommit";
    private static final String PARENT_BINDING = "parent";
    private static final String BASE_BINDING = "base";
    private static final String AUX_BINDING = "aux";
    private static final String REVISION_BINDING = "revision";
    private static final String ADDITIONS_BINDING = "additions";
    private static final String DELETIONS_BINDING = "deletions";
    private static final String INITIAL_COMMIT_BINDING = "initialCommit";
    private static final String FILTER_IN = "%FILTER_IN%";
    private static final String ADMIN_USER_IRI = "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997";

    // General Queries
    private static final String GET_VERSIONEDRDFRECORD_IRIS;
    private static final String CONSTRUCT_DEFAULT;
    private static final String CLEAN_PROV;

    // Commit Queries
    private static final String GET_INITIAL_COMMIT;
    private static final String GET_ALL_COMMIT_IRIS;
    private static final String GET_MASTER_CHAIN;
    private static final String GET_COMMIT_BASE_AUX;
    private static final String REPLACE_COMMIT_IRIS_SUBJECT;
    private static final String REPLACE_COMMIT_IRIS_OBJECT;
    private static final String CONSTRUCT_COMMIT_METADATA;

    static {
        try {
            // General
            GET_VERSIONEDRDFRECORD_IRIS = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/inversioning/get-versionedRdfRecord-iris.rq")),
                    StandardCharsets.UTF_8
            );
            CONSTRUCT_DEFAULT = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/inversioning/construct-default-graph.rq")),
                    StandardCharsets.UTF_8
            );
            CLEAN_PROV = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/inversioning/clean-prov.rq")),
                    StandardCharsets.UTF_8
            );

            // Commits
            GET_INITIAL_COMMIT = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/inversioning/commits/get-initial-commit.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ALL_COMMIT_IRIS = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/inversioning/commits/get-all-commit-iris.rq")),
                    StandardCharsets.UTF_8
            );
            GET_MASTER_CHAIN = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/inversioning/commits/get-master-chain.rq")),
                    StandardCharsets.UTF_8
            );
            GET_COMMIT_BASE_AUX = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/inversioning/commits/get-commit-base-aux.rq")),
                    StandardCharsets.UTF_8
            );
            REPLACE_COMMIT_IRIS_SUBJECT = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/inversioning/commits/replace-commit-iris-subject.rq")),
                    StandardCharsets.UTF_8
            );
            REPLACE_COMMIT_IRIS_OBJECT = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/inversioning/commits/replace-commit-iris-object.rq")),
                    StandardCharsets.UTF_8
            );
            CONSTRUCT_COMMIT_METADATA = IOUtils.toString(
                    Objects.requireNonNull(InversioningMigration.class
                            .getResourceAsStream("/inversioning/commits/construct-commit-metadata.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    final ValueFactory vf = new ValidatingValueFactory();
    final ModelFactory mf = new DynamicModelFactory();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference(target = "(id=systemTemp)")
    OsgiRepository tempRepo;

    @Reference(target = "(id=prov)")
    OsgiRepository provRepo;

    @Reference
    VersioningManager versioningManager;

    @Reference
    RecordManager recordManager;

    @Reference
    BranchManager branchManager;

    @Reference
    RevisionManager revisionManager;

    @Reference
    CommitManager commitManager;

    @Reference
    DifferenceManager differenceManager;

    @Reference
    ThingManager thingManager;

    @Reference
    UserFactory userFactory;

    @Reference
    BranchFactory branchFactory;

    @Override
    public void execute() {
        RestoreUtils.out("Starting operation to convert VersionedRDFRecord commit history to reverse delta "
                + "structure", LOGGER);
        User admin = userFactory.createNew(vf.createIRI(ADMIN_USER_IRI));
        Map<Resource, VersionedRDFRecord> recordMap = new HashMap<>();
        Map<Resource, Exception> errorMap = new HashMap<>();
        try (RepositoryConnection tempConn = tempRepo.getConnection();
             RepositoryConnection sysConn = configProvider.getRepository().getConnection()) {
            copyNonVersionedGraphs(tempConn, sysConn);

            for (Resource originalRecordIRI : getVersionedRdfRecordIRIs(tempConn)) {
                try {
                    VersionedRDFRecord record = restoreCommits(originalRecordIRI, admin, tempConn,
                            configProvider.getRepository());
                    recordMap.put(originalRecordIRI, record);
                    restoreInProgressCommits(originalRecordIRI, tempConn, sysConn);
                } catch (Exception e) {
                    RestoreUtils.error("Error creating record " + originalRecordIRI.stringValue(), e, LOGGER);
                    errorMap.put(originalRecordIRI, e);
                }
            }

            long startTime = System.currentTimeMillis();
            // Restore all Record Graphs
            try (RepositoryResult<Resource> contextIDs = tempConn.getContextIDs()) {
                contextIDs.forEach(context -> {
                    if (context.stringValue().startsWith("https://mobi.com/records#")) {
                        try (RepositoryResult<Statement> statements =
                                     tempConn.getStatements(null, null, null, context)) {
                            sysConn.add(statements);
                        }
                    }
                });
            }
            long endTime = System.currentTimeMillis();
            RestoreUtils.out(String.format("Restored all Record graphs in %s ms", endTime - startTime), LOGGER);

            startTime = System.currentTimeMillis();
            // Restore MasterBranches and delete temporary VersionedRDFRecord graphs
            recordMap.forEach((originalRecordIRI, record) ->
                    restoreMasterBranch(record, originalRecordIRI, tempConn, sysConn));
            endTime = System.currentTimeMillis();
            RestoreUtils.out(String.format("Updated MASTER branches in %s ms", endTime - startTime), LOGGER);
        }

        long startTime = System.currentTimeMillis();
        // Clean prov of CreateActivities for temporary VersionedRDFRecords
        try (RepositoryConnection provConn = provRepo.getConnection()) {
            recordMap.values().forEach(temporaryRecord -> {
                Update cleanProv = provConn.prepareUpdate(CLEAN_PROV);
                cleanProv.setBinding(RECORD_BINDING, temporaryRecord.getResource());
                cleanProv.execute();
            });
        }
        long endTime = System.currentTimeMillis();
        RestoreUtils.out(String.format("Cleaned prov repository in %s ms", endTime - startTime), LOGGER);

        // Delete systemTemp repository and data
        try {
            Files.delete(Paths.get(System.getProperty("karaf.etc") + File.separator
                    + "com.mobi.service.repository.native-systemTemp.cfg"));
            tempRepo.shutDown();
            File tempRepoData = tempRepo.getDataDir();
            FileUtils.deleteDirectory(tempRepoData);
        } catch (IOException e) {
            throw new MobiException("Could not delete systemTemp configuration file", e);
        }

        errorMap.forEach((recordIRI, err) -> {
            RestoreUtils.error("Error creating record " + recordIRI.stringValue(), err, LOGGER);
            LOGGER.error("Error creating record " + recordIRI.stringValue(), err);
        });
    }

    private VersionedRDFRecord restoreCommits(Resource originalRecordIRI, User admin, RepositoryConnection tempConn,
                                              Repository repository) {
        try (RepositoryConnection sysConn = repository.getConnection()) {
            long startTime = System.currentTimeMillis();
            RecordService<? extends VersionedRDFRecord> recordService = getRecordService(originalRecordIRI, tempConn);
            Resource initialCommit = getInitialCommit(originalRecordIRI, tempConn);
            List<Resource> commits = getAllCommitIRIs(initialCommit, tempConn);
            List<Resource> masterCommits = getMasterChain(originalRecordIRI, tempConn);

            RestoreUtils.out(String.format("Updating VersionedRDFRecord %s with %s total commits",
                    originalRecordIRI.stringValue(), commits.size()), LOGGER);

            VersionedRDFRecord record = createRecord(initialCommit, originalRecordIRI, admin, recordService, tempConn,
                    sysConn);
            Resource recordIRI = record.getResource();
            Resource catalogIRI = configProvider.getLocalCatalogIRI();
            Resource masterBranchIRI = record.getMasterBranch_resource()
                    .orElseThrow(() -> new IllegalStateException("Record does not have an associated MasterBranch"));
            Resource newInitialCommitIRI = getFirstObjectResource(sysConn.getStatements(masterBranchIRI,
                    vf.createIRI(Branch.head_IRI), null), "Master branch does not have HEAD commit");

            restoreCommitIRIs(initialCommit, newInitialCommitIRI, tempConn, sysConn);

            Map<Resource, CommitData> commitDataMap = getCommitBaseAux(commits, tempConn);
            commits.remove(0); // Remove initial commit, accounted for in createRecord

            for (Resource commitIri : commits) {
                CommitData commitData = commitDataMap.get(commitIri);
                if (masterCommits.contains(commitIri) && commitData.aux.isEmpty()) {
                    // If the commit is directly on master commit to master
                    addCommit(commitData, admin, catalogIRI, recordIRI, masterBranchIRI, tempConn, sysConn);
                } else if (commitData.aux.isPresent()) {
                    // Handle merge commits
                    // Determine if the source branch is master or another branch
                    Branch sourceBranch = null;
                    Resource source;
                    Resource masterHeadIRI = commitManager.getHeadCommitIRI(
                            branchManager.getMasterBranch(catalogIRI, recordIRI, sysConn));
                    if (commitData.aux.get().equals(masterHeadIRI)) {
                        source = masterBranchIRI;
                    } else {
                        sourceBranch = addBranch(catalogIRI, recordIRI, commitData.aux.get(), sysConn);
                        source = sourceBranch.getResource();
                    }

                    // Determine if the target branch is master or another branch
                    Branch targetBranch = null;
                    Resource target;
                    if (masterCommits.contains(commitData.commit)) {
                        target = masterBranchIRI;
                    } else {
                        targetBranch = addBranch(catalogIRI, recordIRI, commitData.base, sysConn);
                        target = targetBranch.getResource();
                    }

                    // Handle conflicts
                    DeltaModels deltaModels = getDeltaModels(commitData.commit, tempConn);
                    Map<Resource, Conflict> conflictMap;
                    conflictMap = differenceManager.getConflicts(commitData.aux.get(), commitData.base, sysConn)
                            .stream().collect(Collectors.toMap(Conflict::getIRI, Function.identity()));

                    LOGGER.debug("Merging commit %s of %s into %s ", commitData.commit,
                            commitData.aux.get().stringValue(), commitData.base.stringValue());
                    Resource mergeCommit = versioningManager.merge(catalogIRI, recordIRI, source, target, admin,
                            deltaModels.additions, deltaModels.deletions, conflictMap, sysConn);
                    restoreCommitIRIs(commitData.commit, mergeCommit, tempConn, sysConn);

                    // Clear temporary branches
                    if (sourceBranch != null) {
                        cleanBranch(recordIRI, sourceBranch.getResource(), sysConn);
                    }
                    if (targetBranch != null) {
                        cleanBranch(recordIRI, targetBranch.getResource(), sysConn);
                    }
                } else {
                    // Commit to forward branch
                    // Create temporary branch for commit, add commit, then delete the temporary branch
                    Branch branch = addBranch(catalogIRI, recordIRI, commitData.base, sysConn);
                    addCommit(commitData, admin, catalogIRI, recordIRI, branch.getResource(), tempConn, sysConn);
                    cleanBranch(recordIRI, branch.getResource(), sysConn);
                }
            }
            long endTime = System.currentTimeMillis();
            RestoreUtils.out(String.format("Updated VersionedRDFRecord %s in %s ms", originalRecordIRI.stringValue(),
                    endTime - startTime), LOGGER);
            return record;
        }
    }

    private void restoreInProgressCommits(Resource originalRecordIRI, RepositoryConnection tempConn,
                                          RepositoryConnection sysConn) {
        IRI additionsIRI = vf.createIRI(Revision.additions_IRI);
        IRI deletionsIRI = vf.createIRI(Revision.deletions_IRI);
        List<Resource> ipcIRIs = tempConn.getStatements(null, vf.createIRI(InProgressCommit.onVersionedRDFRecord_IRI),
                        originalRecordIRI)
                .stream()
                .map(Statement::getSubject)
                .toList();
        for (Resource ipcIRI : ipcIRIs) {
            Model ipc = QueryResults.asModel(tempConn.getStatements(null, null, null, ipcIRI));
            Resource revisionIRI = (Resource) ipc.filter(ipcIRI, PROV.GENERATED, null)
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("InProgressCommit is missing revision"))
                    .getObject();
            Resource additionsGraph = (Resource) ipc.filter(null, additionsIRI, null)
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("InProgressCommit is missing additions graph"))
                    .getObject();
            Resource deletionsGraph = (Resource) ipc.filter(null, deletionsIRI, null)
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("InProgressCommit is missing deletions graph"))
                    .getObject();
            Resource newAdditionsGraph = vf.createIRI(Catalogs.DELTAS_NAMESPACE + UUID.randomUUID() + "-A");
            Resource newDeletionsGraph = vf.createIRI(Catalogs.DELTAS_NAMESPACE + UUID.randomUUID() + "-B");
            ipc.remove(null, additionsIRI, additionsGraph);
            ipc.remove(null, deletionsIRI, deletionsGraph);
            ipc.add(revisionIRI, additionsIRI, newAdditionsGraph);
            ipc.add(revisionIRI, deletionsIRI, newDeletionsGraph);

            sysConn.add(ipc, ipcIRI);

            sysConn.add(tempConn.getStatements(null, null, null, additionsGraph), newAdditionsGraph);
            sysConn.add(tempConn.getStatements(null, null, null, deletionsGraph), newDeletionsGraph);
        }
    }

    private DeltaModels getDeltaModels(Resource commitIRI, RepositoryConnection tempConn) {
        Resource revisionIRI = getFirstObjectResource(
                tempConn.getStatements(commitIRI, PROV.GENERATED, null, commitIRI), "Commit missing revision");
        Resource additionsGraphIRI = getFirstObjectResource(
                tempConn.getStatements(revisionIRI, vf.createIRI(Revision.additions_IRI), null, commitIRI),
                "Revision missing additions");
        Resource deletionsGraphIRI = getFirstObjectResource(
                tempConn.getStatements(revisionIRI, vf.createIRI(Revision.deletions_IRI), null, commitIRI),
                "Revision missing deletions");

        Model additions = mf.createEmptyModel();
        tempConn.getStatements(null, null, null, additionsGraphIRI)
                .forEach(st -> additions.add(st.getSubject(), st.getPredicate(), st.getObject()));
        Model deletions = mf.createEmptyModel();
        tempConn.getStatements(null, null, null, deletionsGraphIRI)
                .forEach(st -> deletions.add(st.getSubject(), st.getPredicate(), st.getObject()));
        return new DeltaModels(additions, deletions);
    }

    private record DeltaModels(Model additions, Model deletions) {}

    private Branch addBranch(Resource catalogIRI, Resource recordIRI, Resource headIRI, RepositoryConnection sysConn) {
        Branch branch = branchManager.createBranch("", "", branchFactory);
        branch.setProperty(headIRI, vf.createIRI(Branch.head_IRI));
        branchManager.addBranch(catalogIRI, recordIRI, branch, sysConn);
        return branch;
    }

    private void cleanBranch(Resource recordIRI, Resource branchIRI, RepositoryConnection sysConn) {
        thingManager.remove(branchIRI, sysConn);
        sysConn.remove(recordIRI, vf.createIRI(VersionedRDFRecord.branch_IRI), branchIRI);
    }

    @Override
    public Integer getPriority() {
        return 1;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        return VersionRange.createFromVersionSpec("(,4.0)");
    }

    private void copyNonVersionedGraphs(RepositoryConnection tempConn, RepositoryConnection sysConn) {
        long startTime = System.currentTimeMillis();
        // Add default graph back in - will update the state references later
        GraphQuery constructDefault = tempConn.prepareGraphQuery(CONSTRUCT_DEFAULT);
        try (GraphQueryResult result = constructDefault.evaluate()) {
            result.stream().forEach(sysConn::add);
        }

        startTime = System.currentTimeMillis();
        // Add all graphs that do not start with the following prefixes
        List<String> ignoredPrefixes = Arrays.asList("https://mobi.com/additions#", "https://mobi.com/deletions#",
                "https://mobi.com/commits#", "https://mobi.com/in-progress-commits#", "https://mobi.com/records#");
        try (RepositoryResult<Resource> contextIDs = tempConn.getContextIDs()) {
            List<Resource> contexts = contextIDs.stream()
                    .filter(id -> !ignoredPrefixes.stream().anyMatch(prefix -> id.stringValue().startsWith(prefix)))
                    .toList();

            contexts.forEach(context -> {
                LOGGER.debug("Writing graph " + context.stringValue());
                RepositoryResult<Statement> statements = tempConn.getStatements(null, null, null, context);
                sysConn.begin(IsolationLevels.NONE);
                sysConn.add(statements);
                sysConn.commit();
            });
        }

        long endTime = System.currentTimeMillis();
        RestoreUtils.out(String.format("Copied non VersionedRDFRecord graphs in %s ms", endTime - startTime), LOGGER);
    }

    private List<Resource> getVersionedRdfRecordIRIs(RepositoryConnection tempConn) {
        TupleQuery getVersionedRdfRecordIRIs = tempConn.prepareTupleQuery(GET_VERSIONEDRDFRECORD_IRIS);
        try (TupleQueryResult result = getVersionedRdfRecordIRIs.evaluate()) {
            return result.stream()
                    .map(bindings -> Bindings.requiredResource(bindings, RECORD_BINDING))
                    .toList();

        }
    }

    private Resource getInitialCommit(Resource recordIri, RepositoryConnection tempConn) {
        TupleQuery getInitialCommit = tempConn.prepareTupleQuery(GET_INITIAL_COMMIT);
        getInitialCommit.setBinding(RECORD_BINDING, recordIri);
        try (TupleQueryResult result = getInitialCommit.evaluate()) {
            BindingSet bindings = result.stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("Could not find initial commit for Record "
                            + recordIri.stringValue()));
            return Bindings.requiredResource(bindings, INITIAL_COMMIT_BINDING);
        }
    }

    private List<Resource> getAllCommitIRIs(Resource initialCommit, RepositoryConnection tempConn) {
        TupleQuery getAllCommitIRIs = tempConn.prepareTupleQuery(GET_ALL_COMMIT_IRIS);
        getAllCommitIRIs.setBinding(INITIAL_COMMIT_BINDING, initialCommit);
        try (TupleQueryResult result = getAllCommitIRIs.evaluate()) {
            List<Resource> allCommits = new ArrayList<>();
            allCommits.add(initialCommit);
            result.stream()
                    .map(bindings -> Bindings.requiredResource(bindings, COMMIT_BINDING))
                    .forEach(allCommits::add);
            return allCommits;
        }
    }

    private List<Resource> getMasterChain(Resource originalRecordIRI, RepositoryConnection tempConn) {
        TupleQuery getAllCommitIRIs = tempConn.prepareTupleQuery(GET_MASTER_CHAIN);
        getAllCommitIRIs.setBinding(RECORD_BINDING, originalRecordIRI);
        try (TupleQueryResult result = getAllCommitIRIs.evaluate()) {
            return result.stream()
                    .map(bindings -> Bindings.requiredResource(bindings, PARENT_BINDING))
                    .toList();
        }
    }

    private VersionedRDFRecord createRecord(Resource initialCommitIRI, Resource recordIRI, User admin,
                                            RecordService<? extends VersionedRDFRecord> recordService,
                                            RepositoryConnection tempConn, RepositoryConnection sysConn) {
        Revision revision = revisionManager.getRevisionFromCommitId(initialCommitIRI, tempConn);

        // Results are ordered, so first commit will always be the initial
        IRI additions = revision.getAdditions()
                .orElseThrow(() -> new IllegalStateException("Initial commit missing revision"));
        Path path = writeToFile(RDFFormat.TURTLE, tempConn, additions);
        RecordOperationConfig config = getRecordOperationConfig(recordService.getType(), path,
                recordIRI, admin);
        try {
            Files.delete(path);
        } catch (IOException e) {
            throw new MobiException(e);
        }
        return recordService.create(admin, config, sysConn);
    }

    private Map<Resource, CommitData> getCommitBaseAux(List<Resource> commits, RepositoryConnection tempConn) {
        String query = GET_COMMIT_BASE_AUX.replace(FILTER_IN, generateFilterIn(commits));
        TupleQuery getCommitBaseAux = tempConn.prepareTupleQuery(query);
        try (TupleQueryResult result = getCommitBaseAux.evaluate()) {
            Map<Resource, CommitData> commitBaseAux = new HashMap<>();
            result.forEach(bindings -> {
                Resource commit = Bindings.requiredResource(bindings, COMMIT_BINDING);
                Resource base = Bindings.requiredResource(bindings, BASE_BINDING);
                Optional<Resource> aux = bindings.getValue(AUX_BINDING) == null ?
                        Optional.empty() : Optional.of(Bindings.requiredResource(bindings, AUX_BINDING));
                Resource revision = Bindings.requiredResource(bindings, REVISION_BINDING);
                Resource additions = Bindings.requiredResource(bindings, ADDITIONS_BINDING);
                Resource deletions = Bindings.requiredResource(bindings, DELETIONS_BINDING);
                commitBaseAux.put(commit, new CommitData(commit, base, aux, revision, additions, deletions));
            });
            return commitBaseAux;
        }
    }

    private record CommitData(Resource commit, Resource base, Optional<Resource> aux, Resource revision,
                              Resource additions, Resource deletions) {}

    private void addCommit(CommitData commitData, User admin, Resource catalogIRI, Resource recordIRI,
                           Resource branchIRI, RepositoryConnection tempConn, RepositoryConnection sysConn) {
        try {
            LOGGER.debug("Adding commit: %s", commitData.commit.stringValue());
            Path additionsPath = writeToFile(RDFFormat.TURTLE, tempConn, commitData.additions);
            Path deletionsPath = writeToFile(RDFFormat.TURTLE, tempConn, commitData.deletions);

            InProgressCommit ipc = commitManager.createInProgressCommit(admin);
            commitManager.addInProgressCommit(catalogIRI, recordIRI, ipc, sysConn);
            Revision ipcRev = revisionManager.getGeneratedRevision(ipc);
            Resource additions = ipcRev.getAdditions().orElseThrow(() -> new IllegalStateException(
                    "Additions not set on Revision " + ipcRev.getResource().stringValue()));
            Resource deletions = ipcRev.getDeletions().orElseThrow(() -> new IllegalStateException(
                    "Additions not set on Revision " + ipcRev.getResource().stringValue()));

            sysConn.begin(IsolationLevels.NONE);
            sysConn.add(Files.newInputStream(additionsPath), RDFFormat.TURTLE, additions);
            sysConn.commit();
            sysConn.begin(IsolationLevels.NONE);
            sysConn.add(Files.newInputStream(deletionsPath), RDFFormat.TURTLE, deletions);
            sysConn.commit();

            Resource newCommit = versioningManager.commit(catalogIRI, recordIRI, branchIRI, admin,
                    "Message to be replaced", sysConn);
            restoreCommitIRIs(commitData.commit, newCommit, tempConn, sysConn);
            Files.delete(additionsPath);
            Files.delete(deletionsPath);
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    private void restoreCommitIRIs(Resource originalCommit, Resource newCommit, RepositoryConnection tempConn,
                                   RepositoryConnection sysConn) {
        // Restore commit IRIs
        Update replaceCommitIRIsSubject = sysConn.prepareUpdate(REPLACE_COMMIT_IRIS_SUBJECT);
        replaceCommitIRIsSubject.setBinding(COMMIT_BINDING, originalCommit);
        replaceCommitIRIsSubject.setBinding(NEW_COMMIT_BINDING, newCommit);
        replaceCommitIRIsSubject.execute();

        Update replaceCommitIRIsObject = sysConn.prepareUpdate(REPLACE_COMMIT_IRIS_OBJECT);
        replaceCommitIRIsObject.setBinding(COMMIT_BINDING, originalCommit);
        replaceCommitIRIsObject.setBinding(NEW_COMMIT_BINDING, newCommit);
        replaceCommitIRIsObject.execute();

        // Move to original graph name
        Update moveGraphs = sysConn.prepareUpdate("MOVE <" + newCommit.stringValue() + "> TO <"
                + originalCommit.stringValue() + ">");
        moveGraphs.execute();

        // Restore metadata
        GraphQuery getMetadata = tempConn.prepareGraphQuery(CONSTRUCT_COMMIT_METADATA);
        getMetadata.setBinding(COMMIT_BINDING, originalCommit);
        sysConn.remove(originalCommit, DCTERMS.TITLE, null, originalCommit);
        sysConn.remove(originalCommit, PROV.AT_TIME, null, originalCommit);
        sysConn.remove(originalCommit, PROV.WAS_ASSOCIATED_WITH, null, originalCommit);
        try (GraphQueryResult metadata = getMetadata.evaluate()) {
            sysConn.add((Iterable<? extends Statement>) metadata, originalCommit);
        }
    }

    // TODO: THIS IS WILDLY SLOW since it has to copy so much data then clear ...
    private void restoreMasterBranch(VersionedRDFRecord record, Resource originalRecordIRI,
                                     RepositoryConnection tempConn, RepositoryConnection sysConn) {
        // Original Record and Branches graphs exist in the system repo already
        // Need to delete newly created master branch data and add MasterBranch type
        // Add headGraph to MasterBranch
        Resource masterBranchIRI = record.getMasterBranch_resource()
                .orElseThrow(() -> new IllegalStateException("Record does not have an associated MasterBranch"));
        Resource headGraphIRI = getFirstObjectResource(sysConn.getStatements(masterBranchIRI,
                vf.createIRI(MasterBranch.headGraph_IRI), null, masterBranchIRI),
                "MasterBranch does not have headGraph property");
        sysConn.remove((Resource) null, null, null, masterBranchIRI);

        Resource originalMasterIRI = getFirstObjectResource(tempConn.getStatements(originalRecordIRI,
                vf.createIRI(VersionedRDFRecord.masterBranch_IRI), null, originalRecordIRI),
                "VersionedRDFRecord does not have masterBranch property");
        sysConn.add(originalMasterIRI, RDF.TYPE, vf.createIRI(MasterBranch.TYPE), originalMasterIRI);
        sysConn.add(originalMasterIRI, vf.createIRI(MasterBranch.headGraph_IRI), headGraphIRI, originalMasterIRI);

        // Remove temporary record used in restore
        sysConn.remove((Resource) null, null, null, record.getResource());
    }

    private RecordService<? extends VersionedRDFRecord> getRecordService(Resource recordId,
                                                                         RepositoryConnection tempConn) {
        RecordService<?> recordService = recordManager.getRecordService(recordId, tempConn);
        if (!VersionedRDFRecord.class.isAssignableFrom(recordService.getType())) {
            throw new IllegalStateException("Could not find a VersionedRDFRecord RecordService for"
                    + recordId.stringValue());
        }
        return (RecordService<? extends VersionedRDFRecord>) recordService;
    }

    private Path writeToFile(RDFFormat format, RepositoryConnection conn, Resource... graph) {
        try {
            String tmpDir = System.getProperty("java.io.tmpdir");
            Path tmpFile = Files.createFile(Paths.get(tmpDir + File.separator + UUID.randomUUID()));
            try (OutputStream outputStream = Files.newOutputStream(tmpFile)) {
                RDFWriter writer = Rio.createWriter(format, outputStream);
                writer.getWriterConfig().set(TurtleWriterSettings.ABBREVIATE_NUMBERS, false);
                writer.getWriterConfig().set(BasicParserSettings.PRESERVE_BNODE_IDS, true);
                writer.startRDF();
                RepositoryResult<Statement> statements = conn.getStatements(null, null, null, graph);
                statements.forEach(statement -> com.mobi.persistence.utils.rio.Rio.write(statement, writer));
                writer.endRDF();
            }
            return tmpFile;
        } catch (Exception e) {
            throw new MobiException(e);
        }
    }

    private RecordOperationConfig getRecordOperationConfig(Class<? extends Record> clazz, Path path,
                                                           Resource recordIri, User admin) {
        RecordOperationConfig config = new OperationConfig();

        // Config will be replaced with original triples after record is fully constructed
        config.set(RecordCreateSettings.CATALOG_ID, configProvider.getLocalCatalogIRI().stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, recordIri.stringValue());
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, "");
        config.set(RecordCreateSettings.RECORD_MARKDOWN, "");
        config.set(RecordCreateSettings.RECORD_KEYWORDS, Collections.emptySet());
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, Set.of(admin));

        try {
            if (clazz.equals(MappingRecord.class)) {
                Model mappingModel = Models.createModel(Files.newInputStream(path));
                config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, mappingModel);
            } else {
                config.set(VersionedRDFRecordCreateSettings.FILE_NAME, recordIri.stringValue() + ".ttl");
                config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, Files.newInputStream(path));
            }
        } catch (IOException e) {
            throw new MobiException(e);
        }

        return config;
    }

    private Resource getFirstObjectResource(RepositoryResult<Statement> statements, String message) {
        try (statements) {
            if (statements.hasNext()) {
                return (Resource) statements.next().getObject();
            } else {
                throw new IllegalStateException(message);
            }
        }
    }

    private String generateFilterIn(List<Resource> resources) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < resources.size(); i ++) {
            sb.append("<");
            sb.append(resources.get(i).stringValue());
            sb.append(">");
            if (i < resources.size() - 1) {
                sb.append(", ");
            }
        }
        return sb.toString();
    }
}
