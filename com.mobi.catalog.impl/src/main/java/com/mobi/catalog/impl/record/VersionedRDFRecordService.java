package com.mobi.catalog.impl.record;

import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.*;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordExportConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Set;

public class VersionedRDFRecordService implements RecordService<VersionedRDFRecord> {
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
    public VersionedRDFRecord delete(IRI catalogId, IRI recordId, User user, RepositoryConnection conn) {
        return null;
    }

    @Override
    public <T extends RecordExportConfig> void export(IRI iriRecord, T config, RepositoryConnection conn) {
        BatchExporter writer = new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(config.getFormat(), config.getOutput())));
        writer.setLogger(LOG);
        writer.setPrintToSystem(true);

        VersionedRDFRecord record = utilsService.getExpectedObject(iriRecord, versionedRDFRecordFactory, conn);
        Catalog catalog = record.getCatalog().orElseThrow(()
                -> new IllegalArgumentException("Record " + record.getResource() + " does not contain Catalog property"));

        Set<Resource> processedCommits = new HashSet<>();
        // Write Branches
        record.getBranch_resource().forEach(branchResource -> {


            Branch branch = utilsService.getBranch(record, branchResource, branchFactory, conn);
            branch.getModel().forEach(writer::handleStatement);

            // Write Commits
            for (Resource commitId : utilsService.getCommitChain(catalog.getResource(), false, conn)) {

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
        });
    }
}
