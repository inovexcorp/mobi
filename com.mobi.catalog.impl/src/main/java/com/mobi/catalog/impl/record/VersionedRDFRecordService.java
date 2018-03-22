package com.mobi.catalog.impl.record;

import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.*;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Set;

public class VersionedRDFRecordService extends SimpleRecordService {
    private static final Logger LOG = LoggerFactory.getLogger(SimpleRecordService.class);

    private CatalogUtilsService utilsService;
    private CatalogProvUtils provUtils;
    private ValueFactory vf;
    private SesameTransformer transformer;
    private VersionedRDFRecordFactory versionedRDFRecordFactory;
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
    void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Override
    public VersionedRDFRecord delete(IRI recordId, User user, RepositoryConnection conn) {
        return null;
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
