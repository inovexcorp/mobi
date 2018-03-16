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
import com.mobi.catalog.api.ontologies.mcat.*;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordExportConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class SimpleRecordService implements RecordService<Record> {
    private static final Logger LOG = LoggerFactory.getLogger(SimpleRecordService.class);

    private CatalogUtilsService utilsService;
    private CatalogProvUtils provUtils;
    private ValueFactory vf;
    private SesameTransformer transformer;
    private RecordFactory recordFactory;

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
    void setRecordFactory(RecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }


    @Override
    public  Record delete(IRI catalogId, IRI recordId, User user, RepositoryConnection conn) {

        utilsService.validateResource(catalogId, vf.createIRI(Catalog.TYPE), conn);

        Record record = utilsService.optObject(recordId, recordFactory, conn).orElseThrow(()
                -> new IllegalArgumentException("Record " + recordId + " does not exist"));

        Resource catalog = record.getCatalog_resource().orElseThrow(()
                -> new IllegalStateException("Record " + recordId + " does not have a Catalog set"));

        if (catalog.equals(catalogId)) {
            conn.begin();
            DeleteActivity deleteActivity = provUtils.startDeleteActivity(user, recordId);
            utilsService.remove(record.getResource(), conn);
            utilsService.removeObject(record, conn);
            provUtils.endDeleteActivity(deleteActivity, record);
            conn.commit();
        }

        return record;
    }

    @Override
    public <T extends RecordExportConfig> void export(IRI iriRecord, T config, RepositoryConnection conn) {
        BatchExporter writer = new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(config.getFormat(), config.getOutput())));
        writer.setLogger(LOG);
        writer.setPrintToSystem(true);

        // Write Record
        writer.startRDF();
        Record record = utilsService.getExpectedObject(iriRecord, recordFactory, conn);
        record.getModel().forEach(writer::handleStatement);
        writer.endRDF();
    }
}

