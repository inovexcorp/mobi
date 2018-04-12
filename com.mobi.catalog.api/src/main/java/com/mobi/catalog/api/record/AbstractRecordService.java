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
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.RepositoryConnection;

/**
 * Defines basic functionality of a RecordService. Provides common methods for exporting and deleting a Record.
 * Subclasses of Record can override exportRecord() and deleteRecord() to perform Record specific operations.
 * @param <T> of Record
 */
public abstract class AbstractRecordService<T extends Record> implements RecordService<T> {

    protected CatalogUtilsService utilsService;
    protected CatalogProvUtils provUtils;
    protected ValueFactory valueFactory;
    protected OrmFactory<T> recordFactory;

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

    /**
     * Method that specifies {@link Record} specific write behavior. Can be overridden by subclasses to apply specific export
     * behavior.
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
     * @throws {@link IllegalArgumentException} If a setting is not valid
     */
    protected void validateSettings(RecordOperationConfig config) {
        BatchExporter exporter = config.get(RecordExportSettings.BATCH_EXPORTER);
        if (exporter == null) {
            throw new IllegalArgumentException("BatchExporter must not be null");
        }
    }

    /**
     * Gets a {@link Record} object from the associated factory
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
     * Method that specifies {@link Record} type specific delete behavior. Can be overridden by subclasses to apply specific
     * delete behavior.
     *
     * @param record The {@link Record} to be removed
     * @param conn A {@link RepositoryConnection} to use for lookup
     */
    protected void deleteRecord(T record, RepositoryConnection conn) {
        deleteRecordObject(record, conn);
    }

    /**
     * Removes the Record object from the repository
     *
     * @param record Record to remove
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void deleteRecordObject(T record, RepositoryConnection conn) {
        utilsService.removeObject(record, conn);
    }

    /**
     * Writes the base Record data to the provided ExportWriter
     *
     * @param record The Record to write out
     * @param exporter The BatchExporter that writes the Record data
     */
    protected void writeRecordData(T record, BatchExporter exporter) {
        record.getModel().forEach(exporter::handleStatement);
    }
}
