package org.matonto.etl.service.rdf.export;

/*-
 * #%L
 * org.matonto.etl.rdf
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.CatalogUtilsService;
import org.matonto.catalog.api.builder.Difference;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.etl.api.config.rdf.export.RecordExportConfig;
import org.matonto.etl.api.rdf.export.RecordExportService;
import org.matonto.persistence.utils.BatchExporter;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class RecordExportServiceImpl implements RecordExportService {

    private static final Logger LOG = LoggerFactory.getLogger(RDFExportServiceImpl.class);

    private CatalogManager catalogManager;
    private CatalogUtilsService catalogUtils;
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
    void setCatalogUtils(CatalogUtilsService catalogUtils) {
        this.catalogUtils = catalogUtils;
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
    public void export(RecordExportConfig config) throws IOException {
        BatchExporter writer = new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(config.getFormat(), config.getOutput())));
        writer.setLogger(LOG);
        writer.setPrintToSystem(true);

        Resource localCatalog = catalogManager.getLocalCatalogIRI();

        Set<Resource> records;
        if (config.getRecords() == null) {
            records = catalogManager.getRecordIds(localCatalog);
        } else {
            records = config.getRecords().stream()
                    .map(recordString -> vf.createIRI(recordString))
                    .collect(Collectors.toSet());
        }

        writer.startRDF();
        records.forEach(resource -> {
            // Write Record
            Record record = catalogManager.getRecord(localCatalog, resource, recordFactory)
                    .orElseThrow(() -> new IllegalStateException("Could not retrieve record " + resource.stringValue()));
            record.getModel().forEach(writer::handleStatement);

            // Write Versioned Data
            IRI typeIRI = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI);
            IRI versionedRDFRecordType = vf.createIRI(VersionedRDFRecord.TYPE);
            if (record.getProperties(typeIRI).contains(versionedRDFRecordType)) {
                exportVersionedRDFData(resource, writer);
            }
        });
        writer.endRDF();
    }

    private void exportVersionedRDFData(Resource resource, BatchExporter writer) {
        Resource localCatalog = catalogManager.getLocalCatalogIRI();

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
                Resource commitResource = commit.getResource();

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
