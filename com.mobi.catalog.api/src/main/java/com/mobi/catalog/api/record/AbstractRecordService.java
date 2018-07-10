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

import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.Catalogs;
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
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.RepositoryConnection;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Defines basic functionality of a RecordService. Provides common methods for exporting and deleting a Record.
 * Subclasses of Record can override exportRecord() and deleteRecord() to perform Record specific operations.
 * @param <T> of Record
 */
public abstract class AbstractRecordService<T extends Record> implements RecordService<T> {

    protected CatalogProvUtils provUtils;
    protected CatalogUtilsService utilsService;
    protected OrmFactory<T> recordFactory;
    protected ValueFactory valueFactory;
    protected CatalogFactory catalogFactory;

    @Override
    public T create(User user, RecordOperationConfig config, RepositoryConnection conn) {
        validateCreationConfig(config);
        CreateActivity startActivity = provUtils.startCreateActivity(user);
        OffsetDateTime now = OffsetDateTime.now();
        T record = createRecord(user, config, now, now, conn);
        provUtils.endCreateActivity(startActivity, record.getResource());
        return record;
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

    protected T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                             RepositoryConnection conn) {
        T recordObject = createRecordObject(config, issued, modified, conn);
        conn.begin();
        utilsService.addObject(recordObject, conn);
        conn.commit();
        return recordObject;
    }

    /**
     * Generates a new record namespace and adds the properties from the config to that record.
     *
     * @param config A {@link RecordOperationConfig} that contains the record configuration.
     * @param issued Time the record was issued
     * @param modified Time the record was modified
     * @param conn A {@link RepositoryConnection} to use for lookup
     * @return A {@link Record} of the provided config
     */
    protected T createRecordObject(RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                                   RepositoryConnection conn) {
        T record = recordFactory.createNew(valueFactory.createIRI(Catalogs.RECORD_NAMESPACE + UUID.randomUUID()));
        Literal titleLiteral = valueFactory.createLiteral(config.get(RecordCreateSettings.RECORD_TITLE));
        Literal issuedLiteral = valueFactory.createLiteral(issued);
        Literal modifiedLiteral = valueFactory.createLiteral(modified);
        Set<Value> publishers = config.get(RecordCreateSettings.RECORD_PUBLISHERS).stream()
                .map(user -> (Value) user.getResource())
                .collect(Collectors.toSet());
        IRI catalogIdIRI = valueFactory.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
        record.setCatalog(utilsService.getObject(catalogIdIRI, catalogFactory, conn));

        record.setProperty(titleLiteral, valueFactory.createIRI(_Thing.title_IRI));
        record.setProperty(issuedLiteral, valueFactory.createIRI(_Thing.issued_IRI));
        record.setProperty(modifiedLiteral, valueFactory.createIRI(_Thing.modified_IRI));
        record.setProperties(publishers, valueFactory.createIRI(_Thing.publisher_IRI));
        if (config.get(RecordCreateSettings.RECORD_DESCRIPTION) != null) {
            record.setProperty(valueFactory.createLiteral(config.get(RecordCreateSettings.RECORD_DESCRIPTION)),
                    valueFactory.createIRI(_Thing.description_IRI));
        }
        if (config.get(RecordCreateSettings.RECORD_KEYWORDS).size() > 0) {
            record.setKeyword(config.get(RecordCreateSettings.RECORD_KEYWORDS).stream()
                    .map(valueFactory::createLiteral).collect(Collectors.toSet()));
        }
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
     * @param conn A {@link RepositoryConnection} to use for lookup
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

    /**
     * Verifies if the required config settings have a value
     *
     * @param config The {@link RecordOperationConfig} to validate settings
     */
    protected void validateCreationConfig(RecordOperationConfig config) {
        if (config.get(RecordCreateSettings.CATALOG_ID) == null) {
            throw new IllegalArgumentException("Config parameter " + RecordCreateSettings.CATALOG_ID + " is required.");
        }
        if (config.get(RecordCreateSettings.RECORD_PUBLISHERS).isEmpty()) {
            throw new IllegalArgumentException("Config parameter " + RecordCreateSettings.RECORD_PUBLISHERS
                    + " is required.");
        }
        if (config.get(RecordCreateSettings.RECORD_TITLE) == null) {
            throw new IllegalArgumentException("Config parameter " + RecordCreateSettings.RECORD_TITLE.getKey()
                    + " is required.");
        }
    }
}
