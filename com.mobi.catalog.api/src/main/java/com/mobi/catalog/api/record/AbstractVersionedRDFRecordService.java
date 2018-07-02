package com.mobi.catalog.api.record;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordExportSettings;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.RepositoryConnection;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;

/**
 * Defines functionality for VersionedRDFRecordService. Provides common methods for exporting and deleting a Record.
 * Overrides exportRecord() and deleteRecord() to perform VersionedRDFRecord specific operations such as writing
 * out Branches, Commits, and Tags.
 * @param <T> of VersionedRDFRecord
 */
public abstract class AbstractVersionedRDFRecordService<T extends VersionedRDFRecord>
        extends AbstractRecordService<T> implements RecordService<T> {

    protected CatalogFactory catalogFactory;
    protected CommitFactory commitFactory;
    protected BranchFactory branchFactory;
    protected MergeRequestManager mergeRequestManager;
    protected CatalogUtilsService utils;
    protected VersionedRDFRecordFactory versionedRDFRecordFactory;

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Reference
    void setVersionedRDFRecordFactory(VersionedRDFRecordFactory versionedRDFRecordFactory) {
        this.versionedRDFRecordFactory = versionedRDFRecordFactory;
    }

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
    public T addPropertiesToRecord(T record, RecordOperationConfig config, OffsetDateTime issued,
                                   OffsetDateTime modified, RepositoryConnection conn){
        record.setProperty(valueFactory.createLiteral(config.get(RecordCreateSettings.RECORD_TITLE)),
                valueFactory.createIRI(_Thing.title_IRI));
        record.setProperty(valueFactory.createLiteral(issued), valueFactory.createIRI(_Thing.issued_IRI));
        record.setProperty(valueFactory.createLiteral(modified), valueFactory.createIRI(_Thing.modified_IRI));
        record.setProperties(config.get(RecordCreateSettings.RECORD_PUBLISHERS).stream().map(User::getResource).
                        collect(Collectors.toSet()),
                valueFactory.createIRI(_Thing.publisher_IRI));
        if (config.get(RecordCreateSettings.RECORD_DESCRIPTION) != null) {
            record.setProperty(valueFactory.createLiteral(config.get(RecordCreateSettings.RECORD_DESCRIPTION)),
                    valueFactory.createIRI(_Thing.description_IRI));
        }
        if (config.get(RecordCreateSettings.RECORD_KEYWORDS) != null) {
            record.setKeyword(config.get(RecordCreateSettings.RECORD_KEYWORDS).stream().map(valueFactory::createLiteral).
                    collect(Collectors.toSet()));
        }
        Resource catalogId = record.getResource();
        addVersionedRDFRecord(catalogId, record, conn);
        return record;
    }

    /**
     *
     *
     */
    protected void addVersionedRDFRecord(Resource catalogId, T record, RepositoryConnection conn) {
        if (conn.containsContext(record.getResource())) {
            throw utils.throwAlreadyExists(record.getResource(), recordFactory);
        }
        record.setCatalog(utils.getObject(catalogId, catalogFactory, conn));
        conn.begin();
        if (record.getModel().contains(null, valueFactory.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                versionedRDFRecordFactory.getTypeIRI())) {
            addMasterBranch(record, conn);
        } else {
            utils.addObject(record, conn);
        }
        conn.commit();
    }

    /**
     *
     *
     */
    protected void addMasterBranch(VersionedRDFRecord record, RepositoryConnection conn) {
        if (record.getMasterBranch_resource().isPresent()) {
            throw new IllegalStateException("Record " + record.getResource() + " already has a master Branch.");
        }
        Branch branch = createBranch("MASTER", "The master branch.", branchFactory);
        record.setMasterBranch(branch);
        Set<Branch> branches = record.getBranch_resource().stream()
                .map(branchFactory::createNew)
                .collect(Collectors.toSet());
        branches.add(branch);
        record.setBranch(branches);
        utils.updateObject(record, conn);
        utils.addObject(branch, conn);
    }

    @Override
    public <T extends Branch> T createBranch(@Nonnull String title, String description, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();

        T branch = factory.createNew(valueFactory.createIRI(Catalog.BRANCH_NAMESPACE + UUID.randomUUID()));
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
        deleteRecordObject(record, conn);
        deleteVersionedRDFData(record, conn);
    }

    /**
     * Deletes VersionedRDFRecord specific data (Branches, Commits, Tags) from the repository.
     *
     * @param record The VersionedRDFRecord to delete
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void deleteVersionedRDFData(T record, RepositoryConnection conn) {
        recordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(versionedRDFRecord -> {
                    mergeRequestManager.deleteMergeRequestsWithRecordId(versionedRDFRecord.getResource(), conn);
                    versionedRDFRecord.getVersion_resource()
                            .forEach(resource -> utilsService.removeVersion(versionedRDFRecord.getResource(),
                                    resource, conn));
                    conn.remove(versionedRDFRecord.getResource(),
                            valueFactory.createIRI(VersionedRDFRecord.masterBranch_IRI),null,
                            versionedRDFRecord.getResource());
                    List<Resource> deletedCommits = new ArrayList<>();
                    versionedRDFRecord.getBranch_resource()
                            .forEach(resource -> utilsService.removeBranch(versionedRDFRecord.getResource(),
                                    resource, deletedCommits, conn));
                });
    }

    /**
     * Writes the VersionedRDFRecord data (Branches, Commits, Tags) to the provided ExportWriter
     * If the provided branchesToWrite is empty, will write out all branches.
     *
     * @param record The VersionedRDFRecord to write versioned data
     * @param branchesToWrite The Set of Resources identifying branches to write out
     * @param exporter The ExportWriter to write the VersionedRDFRecord to
     * @param conn A RepositoryConnection to use for lookup
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
}
