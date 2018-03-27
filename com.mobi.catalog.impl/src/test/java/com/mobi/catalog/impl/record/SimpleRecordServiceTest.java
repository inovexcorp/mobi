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

import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.record.config.RecordExportConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.persistence.utils.impl.SimpleSesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.commons.io.IOUtils;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;

import java.io.ByteArrayOutputStream;
import java.util.Optional;

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertTrue;
import static junit.framework.TestCase.assertFalse;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class SimpleRecordServiceTest extends OrmEnabledTestCase {

    private final IRI testIRI = VALUE_FACTORY.createIRI("urn:test");
    private final IRI catalogId = VALUE_FACTORY.createIRI("http://mobi.com/test/catalogs#catalog-test");

    private SimpleRecordService recordService;
    private SimpleSesameTransformer transformer;
    private Record testRecord;
    private User user;
    private DeleteActivity deleteActivity;

    private OrmFactory<Record> RDFRecordFactory = getRequiredOrmFactory(Record.class);
    private OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);

    @Mock
    private CatalogUtilsService utilsService;

    @Mock
    private RecordFactory recordFactory;

    @Mock
    private RepositoryConnection connection;

    @Mock
    private CatalogProvUtils provUtils;

    @Before
    public void setUp() throws Exception {

        recordService = new SimpleRecordService();
        transformer = new SimpleSesameTransformer();
        deleteActivity = deleteActivityFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/activity/delete"));

        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.org/user"));

        testRecord = RDFRecordFactory.createNew(testIRI);
        testRecord.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));
        testRecord.setCatalog(catalogFactory.createNew(catalogId));

        MockitoAnnotations.initMocks(this);
        when(utilsService.getExpectedObject(any(IRI.class), any(OrmFactory.class), eq(connection))).thenReturn(testRecord);
        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);

        injectOrmFactoryReferencesIntoService(recordService);
        recordService.setRecordFactory(recordFactory);
        recordService.setUtilsService(utilsService);
        recordService.setVf(VALUE_FACTORY);
        recordService.setProvUtils(provUtils);
    }

    /* delete() */

    @Test
    public void deleteTest() throws Exception {
        when(utilsService.optObject(eq(testIRI), eq(recordFactory), eq(connection))).thenReturn(Optional.of(testRecord));

        Record deletedRecord = recordService.delete(testIRI, user, connection);

        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), eq(connection));
        verify(utilsService).removeObject(eq(testRecord), eq(connection));
        verify(provUtils).startDeleteActivity(eq(user), eq(testIRI));
        verify(provUtils).endDeleteActivity(eq(deleteActivity), eq(testRecord));
        assertEquals(testRecord, deletedRecord);
    }

    @Test (expected = IllegalArgumentException.class)
    public void deleteRecordDoesNotExistTest() throws Exception {
        when(utilsService.optObject(eq(testIRI), eq(recordFactory), eq(connection))).thenReturn(Optional.empty());

        recordService.delete(testIRI, user, connection);

        verify(utilsService).optObject(eq(testIRI), eq(recordFactory), eq(connection));
    }

    /* export() */

    @Test
    public void exportUsingOutputStreamTest() throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        RecordExportConfig config = new RecordExportConfig.Builder(os, RDFFormat.JSONLD, transformer).build();

        BatchExporter exporter = config.getBatchExporter();
        assertFalse(exporter.isActive());
        recordService.export(testIRI, config, connection);
        assertFalse(exporter.isActive());

        Model outputModel = Values.mobiModel(Rio.parse((IOUtils.toInputStream(os.toString())), "", RDFFormat.JSONLD));
        assertEquals(testRecord.getModel(), outputModel);

        verify(utilsService).getExpectedObject(eq(testIRI), any(OrmFactory.class), eq(connection));
    }

    @Test
    public void exportUsingBatchExporterTest() throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        BatchExporter exporter = new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.JSONLD, os)));
        RecordExportConfig config = new RecordExportConfig.Builder(exporter).build();

        assertFalse(exporter.isActive());
        exporter.startRDF();
        assertTrue(exporter.isActive());
        recordService.export(testIRI, config, connection);
        exporter.endRDF();
        assertFalse(exporter.isActive());

        Model outputModel = Values.mobiModel(Rio.parse((IOUtils.toInputStream(os.toString())), "", RDFFormat.JSONLD));
        assertEquals(testRecord.getModel(), outputModel);

        verify(utilsService).getExpectedObject(eq(testIRI), any(OrmFactory.class), eq(connection));
    }
}
