package com.mobi.etl.rest;

/*-
 * #%L
 * com.mobi.etl.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.catalog.api.RecordManager;
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
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Objects;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class MappingRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String CATALOG_IRI = "http://test.org/catalog";
    private static final String MAPPING_IRI = "http://test.org/test";
    private static final String MAPPING_RECORD_IRI = "http://test.org/record";
    private static final String ERROR_IRI = "http://test.org/error";
    private String mappingJsonld;
    private OrmFactory<MappingRecord> mappingRecordFactory;
    private Model fakeModel;
    private User user;
    private MappingRecord record;
    private IRI catalogId;
    private IRI recordId;

    // Mock services used in server
    private static MappingRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private static MappingManager manager;
    private static CatalogConfigProvider configProvider;
    private static RecordManager recordManager;
    private static EngineManager engineManager;

    @Mock
    private MappingWrapper mappingWrapper;

    @Mock
    private OsgiRepository repo;

    @Mock
    private RepositoryConnection conn;

    @Mock
    private MappingId mappingId;

    @BeforeClass
    public static void startServer() throws Exception {
        vf = getValueFactory();
        mf = getModelFactory();

        manager = Mockito.mock(MappingManager.class);
        configProvider = Mockito.mock(CatalogConfigProvider.class);
        engineManager = Mockito.mock(EngineManager.class);
        recordManager = Mockito.mock(RecordManager.class);

        rest = new MappingRest();
        rest.manager = manager;
        rest.engineManager = engineManager;
        rest.configProvider = configProvider;
        rest.recordManager = recordManager;

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        catalogId = vf.createIRI(CATALOG_IRI);
        recordId = vf.createIRI(MAPPING_RECORD_IRI);

        mappingRecordFactory = getRequiredOrmFactory(MappingRecord.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

        fakeModel = mf.createEmptyModel();
        fakeModel.add(vf.createIRI(MAPPING_IRI), vf.createIRI("http://test.org/isTest"), vf.createLiteral(true));
        record = mappingRecordFactory.createNew(recordId);
        user = userFactory.createNew(vf.createIRI("http://test.org/" + UsernameTestFilter.USERNAME));

        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(configProvider.getRepository()).thenReturn(repo);
        when(repo.getConnection()).thenReturn(conn);
        mappingJsonld = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/mapping.jsonld")), StandardCharsets.UTF_8);

        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class), eq(MappingRecord.class), any(RepositoryConnection.class))).thenReturn(record);
        when(recordManager.removeRecord(catalogId, recordId, user, MappingRecord.class, conn)).thenReturn(record);

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));

        when(mappingId.getMappingIdentifier()).thenReturn(vf.createIRI(MAPPING_IRI));
        when(mappingWrapper.getModel()).thenReturn(fakeModel);
        when(mappingWrapper.getId()).thenReturn(mappingId);
        when(manager.createMapping(any(InputStream.class), any(RDFFormat.class))).thenReturn(mappingWrapper);
        when(manager.createMapping(anyString())).thenReturn(mappingWrapper);
        when(manager.retrieveMapping(vf.createIRI(ERROR_IRI))).thenReturn(Optional.empty());
        when(manager.retrieveMapping(vf.createIRI(MAPPING_IRI))).thenReturn(Optional.of(mappingWrapper));
    }

    @After
    public void reset() throws Exception {
        Mockito.reset(mappingId, mappingWrapper, manager, recordManager);
        closeable.close();
    }

    @Test
    public void uploadEitherFileOrStringTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        InputStream content = getClass().getResourceAsStream("/mapping.jsonld");
        fd.bodyPart("file", "mapping.jsonld", content);
        fd.field("jsonld", mappingJsonld);
        Response response = target().path("mappings").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
        verify(recordManager, times(0)).createRecord(any(User.class), any(RecordOperationConfig.class), eq(MappingRecord.class), any(RepositoryConnection.class));

        response = target().path("mappings").request().post(Entity.entity(FormDataMultiPart.emptyBody(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
        verify(recordManager, times(0)).createRecord(any(User.class), any(RecordOperationConfig.class), eq(MappingRecord.class), any(RepositoryConnection.class));
    }

    @Test
    public void uploadFileTest() throws Exception {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("markdown", "#Markdown");
        fd.field("keywords", "keyword");
        InputStream content = getClass().getResourceAsStream("/mapping.jsonld");
        fd.bodyPart("file", "mapping.jsonld", content);
        Response response = target().path("mappings").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(201, response.getStatus());
        assertEquals(MAPPING_RECORD_IRI, response.readEntity(String.class));
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(recordManager).createRecord(eq(user), config.capture(), eq(MappingRecord.class), any(RepositoryConnection.class));
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
        Response response = target().path("mappings").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(201, response.getStatus());
        assertEquals(MAPPING_RECORD_IRI, response.readEntity(String.class));
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(recordManager).createRecord(eq(user), config.capture(), eq(MappingRecord.class), any(RepositoryConnection.class));
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
        assertEquals(200, response.getStatus());
        verify(manager).retrieveMapping(vf.createIRI(MAPPING_IRI));
        try {
            mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMappingThatDoesNotExistTest() {
        Response response = target().path("mappings/" + encode(ERROR_IRI)).request()
                .accept(MediaType.APPLICATION_JSON_TYPE).get();
        verify(manager).retrieveMapping(vf.createIRI(ERROR_IRI));
        assertEquals(404, response.getStatus());
    }

    @Test
    public void downloadMappingTest() {
        Response response = target().path("mappings/" + encode(MAPPING_IRI)).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        assertEquals(200, response.getStatus());
        verify(manager).retrieveMapping(vf.createIRI(MAPPING_IRI));
    }

    @Test
    public void downloadMappingThatDoesNotExistTest() {
        Response response = target().path("mappings/" + encode(ERROR_IRI)).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        verify(manager).retrieveMapping(vf.createIRI(ERROR_IRI));
        assertEquals(404, response.getStatus());
    }

    @Test
    public void deleteMappingTest() {
        Response response = target().path("mappings/" + encode(MAPPING_RECORD_IRI)).request().delete();
        assertEquals(200, response.getStatus());

        verify(recordManager).removeRecord(catalogId, recordId, user, MappingRecord.class, conn);
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }
}
