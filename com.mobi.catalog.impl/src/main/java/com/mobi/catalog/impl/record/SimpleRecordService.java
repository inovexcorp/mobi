package com.mobi.catalog.impl.record;

import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RDFExportConfigImpl;
import com.mobi.catalog.api.record.config.RecordExportConfig;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class SimpleRecordService implements RecordService {
    private static final Logger LOG = LoggerFactory.getLogger(RDFExportConfigImpl.class);

    private CatalogManager catalogManager;
    private ValueFactory vf;
    private RecordFactory recordFactory;
    private VersionedRDFRecordFactory versionedRDFRecordFactory;
    private BranchFactory branchFactory;
    private SesameTransformer transformer;

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setRecordFactory(RecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Reference
    void setVersionedRDFRecordFactory(VersionedRDFRecordFactory versionedRDFRecordFactory) {
        this.versionedRDFRecordFactory = versionedRDFRecordFactory;
    }

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public void export(IRI iriRecord, RecordExportConfig config) {
        BatchExporter writer = new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(config.getFormat(), config.getOutput())));
        writer.setLogger(LOG);
        writer.setPrintToSystem(true);

        com.mobi.rdf.api.Resource localCatalog = catalogManager.getLocalCatalogIRI();

        //write Record
        writer.startRDF();
        Record record = catalogManager.getRecord(localCatalog, iriRecord, recordFactory)
                .orElseThrow(() -> new IllegalStateException("Could not retrieve record " + iriRecord.stringValue()));
        record.getModel().forEach(writer::handleStatement);

        // Write Versioned Data
        IRI typeIRI = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
        IRI versionedRDFRecordType = vf.createIRI(VersionedRDFRecord.TYPE);
        if (record.getProperties(typeIRI).contains(versionedRDFRecordType)) {
            exportVersionedRDFData(iriRecord, writer);
        }

        writer.endRDF();
    }

    private void exportVersionedRDFData(com.mobi.rdf.api.Resource resource, BatchExporter writer) {
        com.mobi.rdf.api.Resource localCatalog = catalogManager.getLocalCatalogIRI();

        VersionedRDFRecord record = catalogManager.getRecord(localCatalog, resource, versionedRDFRecordFactory)
                .orElseThrow(() -> new IllegalStateException("Could not retrieve record " + resource.stringValue()));

        Set<String> processedCommits = new HashSet<>();
        // Write Branches
        record.getBranch_resource().forEach(branchResource -> {
            Branch branch = catalogManager.getBranch(localCatalog, resource, branchResource, branchFactory)
                    .orElseThrow(() -> new IllegalStateException("Could not retrieve expected branch " + branchResource.stringValue()));
            branch.getModel().forEach(writer::handleStatement);

            // Write Commits
            for (Commit commit : catalogManager.getCommitChain(localCatalog, resource, branch.getResource())) {
                com.mobi.rdf.api.Resource commitResource = commit.getResource();

                if (processedCommits.contains(commitResource.stringValue())) {
                    break;
                } else {
                    processedCommits.add(commitResource.stringValue());
                }

                // Write Commit/Revision Data
                commit = catalogManager.getCommit(localCatalog, resource, branchResource, commitResource)
                        .orElseThrow(() -> new IllegalStateException("Could not retrieve expected commit " + commitResource.stringValue()));
                commit.getModel().forEach(writer::handleStatement);

                // Write Additions/Deletions Graphs
                Difference revisionChanges = catalogManager.getRevisionChanges(commitResource);
                revisionChanges.getAdditions().forEach(writer::handleStatement);
                revisionChanges.getDeletions().forEach(writer::handleStatement);
            }
        });
    }

    }

