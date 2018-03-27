package com.mobi.catalog.impl.record;

import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.*;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;

import java.util.HashSet;
import java.util.Set;

public class VersionedRDFRecordService extends SimpleRecordService {

    protected CommitFactory commitFactory;
    protected BranchFactory branchFactory;


    @Reference
    void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Override
    protected void exportRecord(IRI iriRecord, ExportWriter writer, RepositoryConnection conn) {
        VersionedRDFRecord record = (VersionedRDFRecord) utilsService.getExpectedObject(iriRecord, recordFactory, conn);

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
