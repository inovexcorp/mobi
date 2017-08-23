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
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.etl.api.config.rdf.export.RecordExportConfig;
import org.matonto.etl.api.rdf.export.RecordExportService;
import org.matonto.etl.service.rdf.RDFExportServiceImpl;
import org.matonto.persistence.utils.BatchExporter;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

@Component
public class RecordExportServiceImpl implements RecordExportService {

    private static final Logger LOG = LoggerFactory.getLogger(RDFExportServiceImpl.class);

    private CatalogManager catalogManager;
    private CatalogUtilsService catalogUtils;
    private ValueFactory vf;
    private VersionedRDFRecordFactory recordFactory;
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
    void setRecordFactory(VersionedRDFRecordFactory recordFactory) {
        this.recordFactory = recordFactory;
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

        writer.startRDF();
        catalogManager.getRecordIds(localCatalog).forEach(resource -> {
            // Write Record
            VersionedRDFRecord record = catalogManager.getRecord(localCatalog, resource, recordFactory)
                    .orElseThrow(() -> new IllegalStateException("Could not retrieve expected record " + resource.stringValue()));
            record.getModel().forEach(writer::handleStatement);

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

                    commit = catalogManager.getCommit(localCatalog, resource, branchResource, commitResource)
                            .orElseThrow(() -> new IllegalStateException("Could not retrieve expected commit " + commitResource.stringValue()));
                    commit.getModel().forEach(writer::handleStatement);

                    Resource additionsResource = catalogUtils.getAdditionsResource(commit);
                    Resource deletionsResource = catalogUtils.getDeletionsResource(commit);

                    Difference commitDifference = catalogManager.getCommitDifference(commit.getResource());
                    commitDifference.getAdditions().stream()
                            .map(stmt -> vf.createStatement(stmt.getSubject(), stmt.getPredicate(), stmt.getObject(), additionsResource))
                            .forEach(writer::handleStatement);
                    commitDifference.getDeletions().stream()
                            .map(stmt -> vf.createStatement(stmt.getSubject(), stmt.getPredicate(), stmt.getObject(), deletionsResource))
                            .forEach(writer::handleStatement);
                }
            });
        });
        writer.endRDF();
    }
}
