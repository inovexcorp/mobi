package com.mobi.etl.service.rdf.export;

/*-
 * #%L
 * com.mobi.etl.rdf
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
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.VersionManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.config.rdf.export.RecordExportConfig;
import com.mobi.etl.api.rdf.export.RecordExportService;
import com.mobi.persistence.utils.BatchExporter;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class RecordExportServiceImpl implements RecordExportService {

    private static final Logger LOG = LoggerFactory.getLogger(RDFExportServiceImpl.class);

    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    RecordManager recordManager;

    @Reference
    BranchManager branchManager;

    @Reference
    CommitManager commitManager;

    @Reference
    VersionManager versionManager;

    @Reference
    DifferenceManager differenceManager;

    @Reference
    RecordFactory recordFactory;

    @Reference
    VersionedRDFRecordFactory versionedRDFRecordFactory;

    @Reference
    BranchFactory branchFactory;

    @Override
    public void export(RecordExportConfig config) throws IOException {
        BatchExporter writer = new BatchExporter(new BufferedGroupingRDFHandler(
                Rio.createWriter(config.getFormat(), config.getOutput())));
        writer.setLogger(LOG);
        writer.setPrintToSystem(true);

        Resource localCatalog = configProvider.getLocalCatalogIRI();

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Set<Resource> records;
            if (config.getRecords() == null) {
                records = recordManager.getRecordIds(localCatalog, conn);
            } else {
                records = config.getRecords().stream()
                        .map(recordString -> vf.createIRI(recordString))
                        .collect(Collectors.toSet());
            }

            writer.startRDF();
            records.forEach(resource -> {
                // Write Record
                Record record = recordManager.getRecordOpt(localCatalog, resource, recordFactory, conn)
                        .orElseThrow(() -> new IllegalStateException("Could not retrieve record " + resource));
                record.getModel().forEach(writer::handleStatement);

                // Write Versioned Data
                IRI typeIRI = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
                IRI versionedRDFRecordType = vf.createIRI(VersionedRDFRecord.TYPE);
                if (record.getProperties(typeIRI).contains(versionedRDFRecordType)) {
                    exportVersionedRDFData(resource, writer, conn);
                }
            });
            writer.endRDF();
        }
    }

    private void exportVersionedRDFData(Resource resource, BatchExporter writer, RepositoryConnection conn) {
        Resource localCatalog = configProvider.getLocalCatalogIRI();

        VersionedRDFRecord record = recordManager.getRecordOpt(localCatalog, resource, versionedRDFRecordFactory, conn)
                .orElseThrow(() -> new IllegalStateException("Could not retrieve record " + resource));

        Set<String> processedCommits = new HashSet<>();
        // Write Branches
        record.getBranch_resource().forEach(branchResource -> {
            Branch branch = branchManager.getBranch(localCatalog, resource, branchResource, branchFactory, conn);
            branch.getModel().forEach(writer::handleStatement);

            // Write Commits
            for (Commit commit : commitManager.getCommitChain(localCatalog, resource, branch.getResource(), conn)) {
                Resource commitResource = commit.getResource();

                if (processedCommits.contains(commitResource.stringValue())) {
                    break;
                } else {
                    processedCommits.add(commitResource.stringValue());
                }

                // Write Commit/Revision Data
                commit = commitManager.getCommit(localCatalog, resource, branchResource, commitResource, conn)
                        .orElseThrow(() -> new IllegalStateException("Could not retrieve expected commit "
                                + commitResource));
                commit.getModel().forEach(writer::handleStatement);

                // Write Additions/Deletions Graphs
                Difference revisionChanges = differenceManager.getCommitDifference(commitResource, conn);
                revisionChanges.getAdditions().forEach(writer::handleStatement);
                revisionChanges.getDeletions().forEach(writer::handleStatement);
            }
        });

        // Write Versions
        versionManager.getVersions(localCatalog, resource, conn)
                .forEach(version -> version.getModel().forEach(writer::handleStatement));
    }
}
