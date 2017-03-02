package org.matonto.dataset.rest.impl;

/*-
 * #%L
 * org.matonto.dataset.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;
import static org.matonto.rest.util.RestUtils.encode;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.api.builder.DatasetRecordConfig;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.rest.util.MatontoRestTestNg;
import org.matonto.rest.util.UsernameTestFilter;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class DatasetRestImplTest extends MatontoRestTestNg {
    private DatasetRestImpl rest;
    private ValueFactory vf;
    private ModelFactory mf;
    private ValueConverterRegistry vcr;
    private DatasetRecordFactory datasetRecordFactory;
    private UserFactory userFactory;
    private DatasetRecord record1;
    private DatasetRecord record2;
    private DatasetRecord record3;
    private String[] expectedSortOrder;
    private User user;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private EngineManager engineManager;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        vcr = new DefaultValueConverterRegistry();
        datasetRecordFactory = new DatasetRecordFactory();
        userFactory = new UserFactory();
        datasetRecordFactory.setValueFactory(vf);
        datasetRecordFactory.setModelFactory(mf);
        datasetRecordFactory.setValueConverterRegistry(vcr);
        userFactory.setValueFactory(vf);
        userFactory.setModelFactory(mf);
        userFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(datasetRecordFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        record1 = datasetRecordFactory.createNew(vf.createIRI("http://example.com/record1"));
        record1.setProperty(vf.createLiteral("A"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        record2 = datasetRecordFactory.createNew(vf.createIRI("http://example.com/record2"));
        record2.setProperty(vf.createLiteral("B"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        record3 = datasetRecordFactory.createNew(vf.createIRI("http://example.com/record3"));
        record3.setProperty(vf.createLiteral("C"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        expectedSortOrder = new String[] {
                record3.getResource().stringValue(),
                record2.getResource().stringValue(),
                record1.getResource().stringValue()
        };
        user = userFactory.createNew(vf.createIRI("http://example.com/" + UsernameTestFilter.USERNAME));

        MockitoAnnotations.initMocks(this);
        rest = new DatasetRestImpl();
        rest.setManager(datasetManager);
        rest.setVf(vf);
        rest.setTransformer(transformer);
        rest.setEngineManager(engineManager);

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
    public void setupMocks() {
        reset(datasetManager, transformer);

        when(transformer.sesameModel(any(Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(datasetManager.getDatasetRecords()).thenReturn(Stream.of(record1, record2, record3)
                .collect(Collectors.toSet()));
        when(datasetManager.createDataset(any(DatasetRecordConfig.class))).thenReturn(record1);
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
    }

    @Test
    public void getDatasetRecordsTest() {
        Response response = target().path("datasets").request().get();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).getDatasetRecords();
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 3);
            for (Object aResult : result) {
                JSONObject recordObj = JSONObject.fromObject(aResult);
                assertTrue(recordObj.containsKey("@id"));
                assertTrue(recordObj.getString("@id").equals(record1.getResource().toString())
                        || recordObj.getString("@id").equals(record2.getResource().toString())
                        || recordObj.getString("@id").equals(record3.getResource().toString()));
            }
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDatasetRecordsWithPaginationTest() {
        Response response = target().path("datasets").queryParam("offset", 0).queryParam("limit", 10).request().get();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).getDatasetRecords();
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "3");
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 3);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDatasetRecordsWithPaginationAndLinksTest() {
        Response response = target().path("datasets").queryParam("offset", 1).queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).getDatasetRecords();
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "3");
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        assertTrue(response.hasLink("prev"));
        assertTrue(response.hasLink("next"));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDatasetRecordsWithSortingTest() {
        Response response = target().path("datasets").queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("ascending", false).request().get();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).getDatasetRecords();
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 3);
            for (int i = 0; i < result.size(); i++) {
                JSONObject recordObj = result.getJSONObject(i);
                assertTrue(recordObj.containsKey("@id"));
                assertTrue(recordObj.getString("@id").equals(expectedSortOrder[i]));
            }
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDatasetRecordsWithErrorTest() {
        // Setup:
        when(datasetManager.getDatasetRecords()).thenThrow(new MatOntoException());

        Response response = target().path("datasets").request().get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void createDatasetRecordTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("datasetIRI", "http://example.com/dataset")
                .field("repositoryId", "system")
                .field("description", "description")
                .field("keywords", "test,demo");

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        verify(datasetManager).createDataset(any(DatasetRecordConfig.class));
        assertEquals(response.readEntity(String.class), record1.getResource().stringValue());
    }

    @Test
    public void createDatasetRecordWithoutTitleTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("repositoryId", "system");

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createDatasetRecordWithoutRepositoryIdTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title");

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createDatasetRecordWithInvalidRespositoryIdTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "error");
        when(datasetManager.createDataset(any(DatasetRecordConfig.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createDatasetRecordWithExistingDatasetIRITest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "system")
                .field("datasetIRI", "http://example.com/error");
        when(datasetManager.createDataset(any(DatasetRecordConfig.class))).thenThrow(new IllegalStateException());

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createDatasetRecordWithErrorTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "system");
        when(datasetManager.createDataset(any(DatasetRecordConfig.class))).thenThrow(new MatOntoException());

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void deleteDatasetRecordWithForceTest() {
        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).deleteDataset(record1.getResource());
        verify(datasetManager, never()).safeDeleteDataset(any(Resource.class));
    }

    @Test
    public void deleteDatasetRecordWithoutForceTest() {
        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).safeDeleteDataset(record1.getResource());
        verify(datasetManager, never()).deleteDataset(any(Resource.class));
    }

    @Test
    public void deleteDatasetRecordThatDoesNotExistTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(datasetManager).deleteDataset(any(Resource.class));
        doThrow(new IllegalArgumentException()).when(datasetManager).safeDeleteDataset(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 400);

        response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void deleteDatasetRecordWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(datasetManager).deleteDataset(any(Resource.class));
        doThrow(new MatOntoException()).when(datasetManager).safeDeleteDataset(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 500);

        response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void clearDatasetRecordWithForceTest() {
        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).clearDataset(record1.getResource());
        verify(datasetManager, never()).safeClearDataset(any(Resource.class));
    }

    @Test
    public void clearDatasetRecordWithoutForceTest() {
        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).safeClearDataset(record1.getResource());
        verify(datasetManager, never()).clearDataset(any(Resource.class));
    }

    @Test
    public void clearDatasetRecordThatDoesNotExistTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(datasetManager).clearDataset(any(Resource.class));
        doThrow(new IllegalArgumentException()).when(datasetManager).safeClearDataset(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 400);

        response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void clearDatasetRecordWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException()).when(datasetManager).clearDataset(any(Resource.class));
        doThrow(new MatOntoException()).when(datasetManager).safeClearDataset(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 500);

        response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 500);
    }
}
