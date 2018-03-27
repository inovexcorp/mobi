package com.mobi.catalog.impl.record;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordExportConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class SimpleRecordService implements RecordService<Record> {
    private static final Logger LOG = LoggerFactory.getLogger(SimpleRecordService.class);

    protected CatalogUtilsService utilsService;
    protected CatalogProvUtils provUtils;
    protected ValueFactory vf;
    protected RecordFactory recordFactory;

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
    void setRecordFactory(RecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }


    @Override
    public final Record delete(IRI recordId, User user, RepositoryConnection conn) {

        Record record = utilsService.optObject(recordId, recordFactory, conn).orElseThrow(()
                -> new IllegalArgumentException("Record " + recordId + " does not exist"));

        DeleteActivity deleteActivity = provUtils.startDeleteActivity(user, recordId);
        deleteRecord(record, conn);
        provUtils.endDeleteActivity(deleteActivity, record);

        return record;
    }

    /**
     * Removes the Record object from the repository
     *
     * @param record The Record to be removed
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void deleteRecord(Record record, RepositoryConnection conn) {
        conn.begin();
        utilsService.removeObject(record, conn);
        conn.commit();
    }

    @Override
    public final void export(IRI iriRecord, RecordExportConfig config, RepositoryConnection conn) {
        ExportWriter writerWrapper = new ExportWriter(config.getBatchExporter());
        writerWrapper.setLogger(LOG);
        writerWrapper.setPrintToSystem(true);

        boolean writerIsActive = writerWrapper.isActive();

        // Write Record
        if (!writerIsActive) {
            writerWrapper.startRDFExport();
        }
        exportRecord(iriRecord, writerWrapper, conn);
        if (!writerIsActive) {
            writerWrapper.endRDFExport();
        }
    }

    /**
     * Retrieves a Record based on the given IRI and exports the data to the provided ExportWriter
     *
     * @param iriRecord IRI of the Record to export
     * @param writer An ExportWriter to write the Record to
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void exportRecord(IRI iriRecord, ExportWriter writer, RepositoryConnection conn) {
        Record record = utilsService.getExpectedObject(iriRecord, recordFactory, conn);
        writeRecordData(record, writer);
    }

    /**
     * Writes the base Record data to the provided ExportWriter
     *
     * @param record The Record to write out
     * @param writer The ExportWriter to write the Record to
     */
    protected void writeRecordData(Record record, ExportWriter writer) {
        record.getModel().forEach(writer::handleStatement);
    }

    /**
     * Wrapper class of BatchExporter. Restricts access to start and stop writing methods from subclasses.
     */
    protected class ExportWriter {
        private BatchExporter writer;

        private void startRDFExport() {
            writer.startRDF();
        }

        private void endRDFExport() {
            writer.endRDF();
        }

        protected ExportWriter(BatchExporter writer) {
            this.writer = writer;
        }

        protected void handleStatement(Statement statement) {
            writer.handleStatement(statement);
        }

        protected void setLogger(Logger logger) {
            writer.setLogger(logger);
        }

        protected void setPrintToSystem(boolean printToSystem) {
            writer.setPrintToSystem(printToSystem);
        }

        protected boolean isActive() {
            return writer.isActive();
        }
    }
}

