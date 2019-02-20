package com.mobi.etl.rest.impl;

/*-
 * #%L
 * com.mobi.etl.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import static com.mobi.persistence.utils.ResourceUtils.encode;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertNotNull;
import static org.testng.Assert.fail;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.delimited.MappingId;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.api.delimited.record.config.MappingRecordCreateSettings;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.InputStream;
import java.util.Collections;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class MappingRestImplTest extends MobiRestTestNg {
    private MappingRestImpl rest;
    private static final String CATALOG_IRI = "http://test.org/catalog";
    private static final String MAPPING_IRI = "http://test.org/test";
    private static final String MAPPING_RECORD_IRI = "http://test.org/record";
    private static final String BRANCH_IRI = "http://test.org/branch";
    private static final String ERROR_IRI = "http://test.org/error";
    private String mappingJsonld;
    private ValueFactory vf;
    private OrmFactory<MappingRecord> mappingRecordFactory;
    private Model fakeModel;
    private User user;
    private MappingRecord record;
    private IRI catalogId;
    private IRI recordId;

    @Mock
    private MappingManager manager;

    @Mock
    private MappingWrapper mappingWrapper;

    @Mock
    private MappingId mappingId;

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private EngineManager engineManager;

    @Mock
    private SesameTransformer sesameTransformer;

    @Override
    protected Application configureApp() throws Exception {
        vf = getValueFactory();
        ModelFactory mf = getModelFactory();
        catalogId = vf.createIRI(CATALOG_IRI);
        recordId = vf.createIRI(MAPPING_RECORD_IRI);
        IRI branchId = vf.createIRI(BRANCH_IRI);

        mappingRecordFactory = getRequiredOrmFactory(MappingRecord.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

        fakeModel = mf.createModel();
        fakeModel.add(vf.createIRI(MAPPING_IRI), vf.createIRI("http://test.org/isTest"), vf.createLiteral(true));
        record = mappingRecordFactory.createNew(recordId);
        user = userFactory.createNew(vf.createIRI("http://test.org/" + UsernameTestFilter.USERNAME));

        MockitoAnnotations.initMocks(this);

        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);

        when(sesameTransformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(sesameTransformer.mobiIRI(any(org.eclipse.rdf4j.model.IRI.class))).thenAnswer(i -> Values.mobiIRI(i.getArgumentAt(0, org.eclipse.rdf4j.model.IRI.class)));
        when(sesameTransformer.sesameModel(any(Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(sesameTransformer.sesameStatement(any(Statement.class))).thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));

        rest = new MappingRestImpl();
        rest.setManager(manager);
        rest.setVf(vf);
        rest.setTransformer(sesameTransformer);
        rest.setEngineManager(engineManager);
        rest.setConfigProvider(configProvider);
        rest.setCatalogManager(catalogManager);

        mappingJsonld = IOUtils.toString(getClass().getResourceAsStream("/mapping.jsonld"));

        return new ResourceConfig()
                .register(rest)
                .register(UsernameTestFilter.class)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() throws Exception {
        reset(mappingId, mappingWrapper, manager, catalogManager);

        when(catalogManager.createRecord(any(User.class), any(RecordOperationConfig.class), eq(MappingRecord.class))).thenReturn(record);
        when(catalogManager.removeRecord(catalogId, recordId, mappingRecordFactory)).thenReturn(record);

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));

        when(mappingId.getMappingIdentifier()).thenReturn(vf.createIRI(MAPPING_IRI));
        when(mappingWrapper.getModel()).thenReturn(fakeModel);
        when(mappingWrapper.getId()).thenReturn(mappingId);
        when(manager.createMapping(any(InputStream.class), any(RDFFormat.class))).thenReturn(mappingWrapper);
        when(manager.createMapping(anyString())).thenReturn(mappingWrapper);
        when(manager.retrieveMapping(vf.createIRI(ERROR_IRI))).thenReturn(Optional.empty());
        when(manager.retrieveMapping(vf.createIRI(MAPPING_IRI))).thenReturn(Optional.of(mappingWrapper));
    }

    @Test
    public void uploadEitherFileOrStringTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        InputStream content = getClass().getResourceAsStream("/mapping.jsonld");
        fd.bodyPart(new FormDataBodyPart(FormDataContentDisposition.name("file").fileName("mapping.jsonld").build(),
                content, MediaType.APPLICATION_OCTET_STREAM_TYPE));
        fd.field("jsonld", mappingJsonld);
        Response response = target().path("mappings").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(catalogManager, times(0)).createRecord(any(User.class), any(RecordOperationConfig.class), eq(MappingRecord.class));

        response = target().path("mappings").request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(catalogManager, times(0)).createRecord(any(User.class), any(RecordOperationConfig.class), eq(MappingRecord.class));
    }

    @Test
    public void uploadFileTest() throws Exception {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("markdown", "#Markdown");
        fd.field("keywords", "keyword");
        InputStream content = getClass().getResourceAsStream("/mapping.jsonld");
        fd.bodyPart(new FormDataBodyPart(FormDataContentDisposition.name("file").fileName("mapping.jsonld").build(),
                content, MediaType.APPLICATION_OCTET_STREAM_TYPE));
        Response response = target().path("mappings").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 201);
        assertEquals(MAPPING_RECORD_IRI, response.readEntity(String.class));
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(catalogManager).createRecord(eq(user), config.capture(), eq(MappingRecord.class));
        assertEquals("Title", config.getValue().get(RecordCreateSettings.RECORD_TITLE));
        assertEquals("Description", config.getValue().get(RecordCreateSettings.RECORD_DESCRIPTION));
        assertEquals("#Markdown", config.getValue().get(RecordCreateSettings.RECORD_MARKDOWN));
        assertEquals(Collections.singleton("keyword"), config.getValue().get(RecordCreateSettings.RECORD_KEYWORDS));
        assertEquals(Collections.singleton(user), config.getValue().get(RecordCreateSettings.RECORD_PUBLISHERS));
        assertNotNull(config.getValue().get(MappingRecordCreateSettings.INPUT_STREAM));
        assertNotNull(config.getValue().get(MappingRecordCreateSettings.RDF_FORMAT));
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }

    @Test
    public void uploadStringTest() throws Exception {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("markdown", "#Markdown");
        fd.field("keywords", "keyword");
        fd.field("jsonld", mappingJsonld);
        Response response = target().path("mappings").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        assertEquals(MAPPING_RECORD_IRI, response.readEntity(String.class));
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(catalogManager).createRecord(eq(user), config.capture(), eq(MappingRecord.class));
        assertEquals("Title", config.getValue().get(RecordCreateSettings.RECORD_TITLE));
        assertEquals("Description", config.getValue().get(RecordCreateSettings.RECORD_DESCRIPTION));
        assertEquals("#Markdown", config.getValue().get(RecordCreateSettings.RECORD_MARKDOWN));
        assertEquals(Collections.singleton("keyword"), config.getValue().get(RecordCreateSettings.RECORD_KEYWORDS));
        assertEquals(Collections.singleton(user), config.getValue().get(RecordCreateSettings.RECORD_PUBLISHERS));
        assertNotNull(config.getValue().get(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA));
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }

    @Test
    public void getMappingTest() {
        Response response = target().path("mappings/" + encode(MAPPING_IRI)).request()
                .accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 200);
        verify(manager).retrieveMapping(vf.createIRI(MAPPING_IRI));
        try {
            JSONArray.fromObject(response.readEntity(String.class));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMappingThatDoesNotExistTest() {
        Response response = target().path("mappings/" + encode(ERROR_IRI)).request()
                .accept(MediaType.APPLICATION_JSON_TYPE).get();
        verify(manager).retrieveMapping(vf.createIRI(ERROR_IRI));
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void downloadMappingTest() {
        Response response = target().path("mappings/" + encode(MAPPING_IRI)).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        assertEquals(response.getStatus(), 200);
        verify(manager).retrieveMapping(vf.createIRI(MAPPING_IRI));
    }

    @Test
    public void downloadMappingThatDoesNotExistTest() {
        Response response = target().path("mappings/" + encode(ERROR_IRI)).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        verify(manager).retrieveMapping(vf.createIRI(ERROR_IRI));
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void deleteMappingTest() {
        Response response = target().path("mappings/" + encode(MAPPING_RECORD_IRI)).request().delete();
        assertEquals(response.getStatus(), 200);

        verify(catalogManager).deleteRecord(user, recordId, MappingRecord.class);
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }
}
