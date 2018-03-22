package com.mobi.catalog.impl.record;

import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.*;
import com.mobi.catalog.impl.SimpleCatalogManager;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

public class VersionedRDFRecordService extends SimpleRecordService {
    private static final Logger LOG = LoggerFactory.getLogger(SimpleRecordService.class);

    private CatalogUtilsService utilsService;
    private CatalogProvUtils provUtils;
    private ModelFactory mf;
    private ValueFactory vf;
    private SesameTransformer transformer;
    private VersionedRDFRecordFactory versionedRDFRecordFactory;
    private VersionFactory versionFactory;
    private CommitFactory commitFactory;
    private BranchFactory branchFactory;

    @Reference
    void setUtilsService(CatalogUtilsService utilsService) {
        this.utilsService = utilsService;
    }

    @Reference
    void setProvUtils(CatalogProvUtils provUtils) {
        this.provUtils = provUtils;
    }

    @Reference
    void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    void setVersionedRDFRecordFactory(VersionedRDFRecordFactory versionedRDFRecordFactory) {
        this.versionedRDFRecordFactory = versionedRDFRecordFactory;
    }

    @Reference
    void setVersionFactory(VersionFactory versionFactory) {
        this.versionFactory = versionFactory;
    }

    @Reference
    void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }


    private static final String GET_NEW_LATEST_VERSION;
    private static final String RECORD_BINDING = "record";

    static {
        try {
            GET_NEW_LATEST_VERSION = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/get-new-latest-version.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public void deleteRecord(Record record, RepositoryConnection conn) {
        versionedRDFRecordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(versionedRDFRecord -> {
                    versionedRDFRecord.getVersion_resource()
                            .forEach(resource -> removeVersion(versionedRDFRecord.getResource(), resource, conn));
                    conn.remove(versionedRDFRecord.getResource(), vf.createIRI(VersionedRDFRecord.masterBranch_IRI),
                            null, versionedRDFRecord.getResource());
                    versionedRDFRecord.getBranch_resource()
                            .forEach(resource -> removeBranch(versionedRDFRecord.getResource(), resource, conn));
                    utilsService.removeObject(versionedRDFRecord, conn);
                });
    }

    private void removeVersion(Resource recordId, Version version, RepositoryConnection conn) {
        removeObjectWithRelationship(version.getResource(), recordId, VersionedRecord.version_IRI, conn);
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        if (conn.contains(recordId, latestVersionIRI, version.getResource(), recordId)) {
            conn.remove(recordId, latestVersionIRI, version.getResource(), recordId);
            TupleQuery query = conn.prepareTupleQuery(GET_NEW_LATEST_VERSION);
            query.setBinding(RECORD_BINDING, recordId);
            TupleQueryResult result = query.evaluate();

            Optional<Binding> binding;
            if (result.hasNext() && (binding = result.next().getBinding("version")).isPresent()) {
                conn.add(recordId, latestVersionIRI, binding.get().getValue(), recordId);
            }
        }
        version.getVersionedDistribution_resource().forEach(resource -> utilsService.remove(resource, conn));
    }

    private void removeVersion(Resource recordId, Resource versionId, RepositoryConnection conn) {
        Version version = utilsService.getObject(versionId, versionFactory, conn);
        removeVersion(recordId, version, conn);
    }

    private void removeBranch(Resource recordId, Branch branch, RepositoryConnection conn) {
        removeObjectWithRelationship(branch.getResource(), recordId, VersionedRDFRecord.branch_IRI, conn);
        Optional<Resource> headCommit = branch.getHead_resource();
        if (headCommit.isPresent()) {
            List<Resource> chain = utilsService.getCommitChain(headCommit.get(), false, conn);
            IRI commitIRI = vf.createIRI(Tag.commit_IRI);
            Set<Resource> deltaIRIs = new HashSet<>();
            for (Resource commitId : chain) {
                if (!commitIsReferenced(commitId, conn)) {
                    // Get Additions/Deletions Graphs
                    Revision revision = utilsService.getRevision(commitId, conn);
                    revision.getAdditions().ifPresent(deltaIRIs::add);
                    revision.getDeletions().ifPresent(deltaIRIs::add);
                    revision.getGraphRevision().forEach(graphRevision -> {
                        graphRevision.getAdditions().ifPresent(deltaIRIs::add);
                        graphRevision.getDeletions().ifPresent(deltaIRIs::add);
                    });

                    // Remove Commit
                    utilsService.remove(commitId, conn);

                    // Remove Tags Referencing this Commit
                    Set<Resource> tags = RepositoryResults.asModel(conn.getStatements(null, commitIRI, commitId), mf)
                            .subjects();
                    tags.forEach(tagId -> removeObjectWithRelationship(tagId, recordId, VersionedRecord.version_IRI,
                            conn));
                } else {
                    break;
                }
            }
            deltaIRIs.forEach(resource -> utilsService.remove(resource, conn));
        } else {
            LOG.warn("The HEAD Commit was not set on the Branch.");
        }
    }

    private void removeBranch(Resource recordId, Resource branchId, RepositoryConnection conn) {
        Branch branch = utilsService.getObject(branchId, branchFactory, conn);
        removeBranch(recordId, branch, conn);
    }

    private void removeObjectWithRelationship(Resource objectId, Resource removeFromId, String predicate,
                                              RepositoryConnection conn) {
        utilsService.remove(objectId, conn);
        conn.remove(removeFromId, vf.createIRI(predicate), objectId, removeFromId);
    }

    private boolean commitIsReferenced(Resource commitId, RepositoryConnection conn) {
        IRI headCommitIRI = vf.createIRI(Branch.head_IRI);
        IRI baseCommitIRI = vf.createIRI(Commit.baseCommit_IRI);
        IRI auxiliaryCommitIRI = vf.createIRI(Commit.auxiliaryCommit_IRI);
        return Stream.of(headCommitIRI, baseCommitIRI, auxiliaryCommitIRI)
                .map(iri -> conn.contains(null, iri, commitId))
                .reduce(false, (iri1, iri2) -> iri1 || iri2);
    }


    @Override
    public void exportRecord(IRI iriRecord, ExportWriter writer, RepositoryConnection conn) {
        VersionedRDFRecord record = utilsService.getExpectedObject(iriRecord, versionedRDFRecordFactory, conn);

        Set<Resource> processedCommits = new HashSet<>();
        // Write Branches
        record.getBranch_resource().forEach(branchResource -> {

            Branch branch = utilsService.getBranch(record, branchResource, branchFactory, conn);
            branch.getModel().forEach(writer::handleStatement);

            exportCommits(utilsService.getHeadCommitIRI(branch), processedCommits, writer, conn);
        });
    }

    protected void exportCommits(Resource headIRI, Set<Resource> processedCommits, ExportWriter writer, RepositoryConnection conn) {

        // Write Commits
        for (Resource commitId : utilsService.getCommitChain(headIRI, false, conn)) {

            if (processedCommits.contains(commitId)) {
                break;
            } else {
                processedCommits.add(commitId);
            }

            // Write Commit/Revision Data
            Commit commit = utilsService.getExpectedObject(commitId, commitFactory, conn);
            commit.getModel().forEach(writer::handleStatement);

            // Write Additions/Deletions Graphs
            Difference revisionChanges = utilsService.getRevisionChanges(commitId, conn);
            revisionChanges.getAdditions().forEach(writer::handleStatement);
            revisionChanges.getDeletions().forEach(writer::handleStatement);
        }
    }
}
