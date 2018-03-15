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

import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.record.config.RecordExportConfig;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.impl.SimpleSesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
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

import java.io.ByteArrayOutputStream;

import static junit.framework.TestCase.assertEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class SimpleRecordServiceTest extends OrmEnabledTestCase {

    private SimpleRecordService recordService;
    private OrmFactory<Record> RDFRecordFactory;
    private SimpleSesameTransformer transformer;
    private Record returnRecord;
    private IRI testIRI;

    @Mock
    private CatalogUtilsService utilsService;

    @Mock
    private RecordFactory recordFactory;

    @Mock
    private RepositoryConnection connection;

    @Before
    public void setUp() throws Exception {

        recordService = new SimpleRecordService();
        RDFRecordFactory = getRequiredOrmFactory(Record.class);
        transformer = new SimpleSesameTransformer();

        testIRI = VALUE_FACTORY.createIRI("urn:test");
        returnRecord = RDFRecordFactory.createNew(testIRI);
        returnRecord.setProperty(VALUE_FACTORY.createLiteral("Test Record"), VALUE_FACTORY.createIRI(_Thing.title_IRI));

        MockitoAnnotations.initMocks(this);
        when(utilsService.getExpectedObject(any(Resource.class), any(OrmFactory.class), eq(connection))).thenReturn(returnRecord);

        injectOrmFactoryReferencesIntoService(recordService);
        recordService.setTransformer(transformer);
        recordService.setRecordFactory(recordFactory);
        recordService.setUtilsService(utilsService);
    }

    @Test
    public void exportTest() throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        RecordExportConfig config = new RecordExportConfig.Builder(os, RDFFormat.JSONLD).build();

        recordService.export(testIRI, config, connection);
        Model outputModel = Values.mobiModel(Rio.parse((IOUtils.toInputStream(config.getOutput().toString())), "", RDFFormat.JSONLD));
        assertEquals(returnRecord.getModel(), outputModel);

        verify(utilsService).getExpectedObject(eq(testIRI), any(OrmFactory.class), eq(connection));
    }

    @Test (expected = IllegalArgumentException.class)
    public void exportEmptyIRITest() throws Exception {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        RecordExportConfig config = new RecordExportConfig.Builder(os, RDFFormat.JSONLD).build();

        recordService.export(VALUE_FACTORY.createIRI(""), config, connection);
        verify(utilsService).getExpectedObject(eq(testIRI), any(OrmFactory.class), eq(connection));
    }
}
