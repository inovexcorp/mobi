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
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.RepositoryConnection;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;

/**
 * Defines basic functionality of a RecordService. Provides common methods for exporting and deleting a Record.
 * Subclasses of Record can override exportRecord() and deleteRecord() to perform Record specific operations.
 * @param <T> of Record
 */
public abstract class AbstractRecordService<T extends Record> implements RecordService<T> {

    private BranchFactory branchFactory;
    private CatalogFactory catalogFactory;
    private CatalogUtilsService utils;
    private T record;

    protected CatalogProvUtils provUtils;
    protected CatalogUtilsService utilsService;
    protected OrmFactory<T> recordFactory;
    protected ValueFactory valueFactory;

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Reference
    void setUtils(CatalogUtilsService utils) {
        this.utils = utils;
    }

    @Override
    public T createRecord(User user, RecordCreateSettings config, OrmFactory<T> factory, RepositoryConnection conn){
        CreateActivity startActivity = provUtils.startCreateActivity(user);
        OffsetDateTime now = OffsetDateTime.now();
        this.record = addPropertiesToRecord(factory.createNew(valueFactory.createIRI(Catalog.RECORD_NAMESPACE +
                        UUID.randomUUID())), config, now, now, conn);
        Resource catalogId = record.getResource();
        IRI recordId = valueFactory.createIRI(record.catalog_IRI + catalogId);
        provUtils.endCreateActivity(startActivity, recordId);
        return record;
    }

    protected void addRecord(Resource catalogId, T record, RepositoryConnection conn) {
        conn.begin();
        if (conn.containsContext(record.getResource())) {
            throw utils.throwAlreadyExists(record.getResource(), recordFactory);
        }
        record.setCatalog(utils.getObject(catalogId, catalogFactory, conn));
        if (record.getModel().contains(null, valueFactory.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                recordFactory.getTypeIRI())) {
            addMasterBranch(record, conn);
        } else {
            utils.addObject(record, conn);
            conn.commit();
        }
    }

    protected void addMasterBranch(Record record, RepositoryConnection conn) {
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
    public T delete(IRI recordId, User user, RepositoryConnection conn) {
        T record = getRecord(recordId, conn);

        DeleteActivity deleteActivity = provUtils.startDeleteActivity(user, recordId);
        conn.begin();
        deleteRecord(record, conn);
        conn.commit();
        provUtils.endDeleteActivity(deleteActivity, record);

        return record;
    }

    @Override
    public void export(IRI iriRecord, RecordOperationConfig config, RepositoryConnection conn) {
        validateSettings(config);

        BatchExporter exporter = config.get(RecordExportSettings.BATCH_EXPORTER);
        boolean exporterIsActive = exporter.isActive();
        if (!exporterIsActive) {
            exporter.startRDF();
        }
        T record = getRecord(iriRecord, conn);
        exportRecord(record, config, conn);
        if (!exporterIsActive) {
            exporter.endRDF();
        }
    }

    @Override
    public T addPropertiesToRecord(T record, RecordCreateSettings config, OffsetDateTime issued,
                                                       OffsetDateTime modified, RepositoryConnection conn) {
        record.setProperty(valueFactory.createLiteral(config.getTitle()),
                valueFactory.createIRI(_Thing.title_IRI));
        record.setProperty(valueFactory.createLiteral(issued), valueFactory.createIRI(_Thing.issued_IRI));
        record.setProperty(valueFactory.createLiteral(modified), valueFactory.createIRI(_Thing.modified_IRI));
        record.setProperties(config.getPublishers().stream().map(User::getResource).
                        collect(Collectors.toSet()),
                valueFactory.createIRI(_Thing.publisher_IRI));
        if (config.getDescription() != null) {
            record.setProperty(valueFactory.createLiteral(config.getDescription()),
                    valueFactory.createIRI(_Thing.description_IRI));
        }
        if (config.getKeywords() != null) {
            record.setKeyword(config.getKeywords().stream().map(valueFactory::createLiteral).
                    collect(Collectors.toSet()));
        }
        Resource catalogId = record.getResource();
        addRecord(catalogId, record, conn);
        return record;
    }

    /**
     * Method that specifies {@link Record} specific write behavior. Can be overridden by subclasses to apply specific
     * export behavior.
     *
     * @param record An {@link IRI} of the record to be exported
     * @param config A {@link RecordOperationConfig} that contains the export configuration.
     * @param conn A {@link RepositoryConnection} to the repo where the Record exists
     */
    protected void exportRecord(T record, RecordOperationConfig config, RepositoryConnection conn) {
        BatchExporter exporter = config.get(RecordExportSettings.BATCH_EXPORTER);
        writeRecordData(record, exporter);
    }

    /**
     * Checks that the required passed in settings for a {@link RecordOperationConfig} are valid.
     *
     * @param config The {@link RecordOperationConfig} to validate settings
     * @throws IllegalArgumentException If a setting is not valid
     */
    protected void validateSettings(RecordOperationConfig config) {
        BatchExporter exporter = config.get(RecordExportSettings.BATCH_EXPORTER);
        if (exporter == null) {
            throw new IllegalArgumentException("BatchExporter must not be null");
        }
    }

    /**
     * Gets a {@link Record} object from the associated factory.
     *
     * @param recordId {@link IRI} of the Record
     * @param conn A {@link RepositoryConnection} to use for lookup
     * @return A {@link Record} of the provided IRI
     */
    protected T getRecord(IRI recordId, RepositoryConnection conn) {
        return utilsService.optObject(recordId, recordFactory, conn).orElseThrow(()
                -> new IllegalArgumentException("Record " + recordId + " does not exist"));
    }

    /**
     * Method that specifies {@link Record} type specific delete behavior. Can be overridden by subclasses to apply
     * specific delete behavior.
     *
     * @param record The {@link Record} to be removed
     * @param conn A {@link RepositoryConnection} to use for lookup
     */
    protected void deleteRecord(T record, RepositoryConnection conn) {
        deleteRecordObject(record, conn);
    }

    /**
     * Removes the Record object from the repository.
     *
     * @param record Record to remove
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void deleteRecordObject(T record, RepositoryConnection conn) {
        utilsService.removeObject(record, conn);
    }

    /**
     * Writes the base Record data to the provided ExportWriter.
     *
     * @param record The Record to write out
     * @param exporter The BatchExporter that writes the Record data
     */
    protected void writeRecordData(T record, BatchExporter exporter) {
        record.getModel().forEach(exporter::handleStatement);
    }
}
