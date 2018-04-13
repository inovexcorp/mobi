package com.mobi.sparql.rest.impl;

/*-
 * #%L
 * com.mobi.sparql.rest
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

import static com.mobi.rest.util.RestUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;

import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.RestUtils;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class SparqlRestImplTest extends MobiRestTestNg {
    private SparqlRestImpl rest;
    private Repository repo;
    private ValueFactory vf;
    private ModelFactory mf;

    private String ALL_QUERY;
    private String DATASET_ID;
    private Model testModel;
    private RepositoryConnection conn;

    @Mock
    private RepositoryManager repositoryManager;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private DatasetConnection datasetConnection;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        testModel= mf.createModel();
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyA"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyB"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyC"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyD"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyE"), vf.createLiteral("true"));
        conn = repo.getConnection();
        conn.add(testModel);

        MockitoAnnotations.initMocks(this);

        rest = new SparqlRestImpl();
        rest.setRepository(repositoryManager);
        rest.setDatasetManager(datasetManager);
        rest.setValueFactory(vf);

        DATASET_ID = "http://example.com/datasets/0";
        ALL_QUERY = RestUtils.encode(IOUtils.toString(getClass().getClassLoader().getResourceAsStream("all_query.rq")));

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class);
    }

    @AfterClass
    protected void cleanUp() {
        conn.close();
        assertFalse(conn.isActive());
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(repositoryManager, datasetConnection, datasetManager);

        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.of(repo));
        when(datasetManager.getConnection(any(Resource.class))).thenReturn(datasetConnection);
        when(datasetConnection.prepareTupleQuery(anyString())).thenAnswer(i -> conn.prepareTupleQuery(i.getArgumentAt(0, String.class)));
    }

    @Test
    public void queryTest() {
        Response response = target().path("sparql").queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 200);
        verify(repositoryManager).getRepository("system");
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("head"));
        assertTrue(result.containsKey("results"));
    }

    @Test
    public void queryWithDatasetTest() {
        Response response = target().path("sparql").queryParam("query", ALL_QUERY).queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
        verify(datasetConnection).prepareTupleQuery(anyString());
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("head"));
        assertTrue(result.containsKey("results"));
    }

    @Test
    public void queryRepositoryUnavailableTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path("sparql").queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void queryWithDatasetThatDoesNotExistTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path("sparql").queryParam("query", ALL_QUERY).queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void queryWithInvalidQueryTest() {
        Response response = target().path("sparql").queryParam("query", RestUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);

        response = target().path("sparql").queryParam("query", RestUtils.encode("+")).queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void queryWithDatasetErrorTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = target().path("sparql").queryParam("query", ALL_QUERY).queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void downloadQueryTest() {
        Map<String, String> tests = new HashMap<>();
        tests.put("csv", "text/csv");
        tests.put("tsv", "text/tab-separated-values");
        tests.put("xls", "application/vnd.ms-excel");
        tests.put("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        tests.forEach((type, mimeType) -> {
            Response response = target().path("sparql").queryParam("query", ALL_QUERY)
                    .queryParam("fileName", "test").queryParam("fileType", type).request().get();
            assertEquals(response.getStatus(), 200);
            verify(repositoryManager, atLeastOnce()).getRepository("system");
            MultivaluedMap<String, Object> headers = response.getHeaders();
            assertEquals(headers.get("Content-Type").get(0), mimeType);
            assertEquals(headers.get("Content-Disposition").get(0), "attachment;filename=test." + type);
        });
    }

    @Test
    public void downloadQueryWithDatasetTest() {
        Map<String, String> tests = new HashMap<>();
        tests.put("csv", "text/csv");
        tests.put("tsv", "text/tab-separated-values");
        tests.put("xls", "application/vnd.ms-excel");
        tests.put("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        tests.forEach((type, mimeType) -> {
            Response response = target().path("sparql").queryParam("query", ALL_QUERY).queryParam("dataset", DATASET_ID)
                    .queryParam("fileName", "test").queryParam("fileType", type).request().get();
            assertEquals(response.getStatus(), 200);
            verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
            verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
            MultivaluedMap<String, Object> headers = response.getHeaders();
            assertEquals(headers.get("Content-Type").get(0), mimeType);
            assertEquals(headers.get("Content-Disposition").get(0), "attachment;filename=test." + type);
        });
    }

    @Test
    public void downloadQueryWithNoFileNameTest() {
        Response response = target().path("sparql").queryParam("query", ALL_QUERY).queryParam("fileType", "csv")
                .request().get();
        assertEquals(response.getStatus(), 200);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("Content-Disposition").get(0), "attachment;filename=results.csv");
    }

    @Test
    public void downloadQueryRepositoryUnavailableTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path("sparql").queryParam("query", ALL_QUERY).queryParam("fileType", "csv")
                .request().get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void downloadQueryWithDatasetThatDoesNotExistTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path("sparql").queryParam("query", ALL_QUERY).queryParam("dataset", DATASET_ID)
                .queryParam("fileType", "csv").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void downloadQueryWithInvalidQueryTest() {
        Response response = target().path("sparql").queryParam("query", RestUtils.encode("+"))
                .queryParam("fileType", "csv").request().get();
        assertEquals(response.getStatus(), 400);
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("details"));

        response = target().path("sparql").queryParam("query", RestUtils.encode("+")).queryParam("dataset", DATASET_ID)
                .queryParam("fileType", "csv").request().get();
        assertEquals(response.getStatus(), 400);
        result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("details"));
    }

    @Test
    public void downloadQueryWithInvalidFileTypeTest() {
        Response response = target().path("sparql").queryParam("query", ALL_QUERY)
                .queryParam("fileType", "error").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getPagedResultsTest() {
        Response response = target().path("sparql/page").queryParam("query", ALL_QUERY).request().get();
        assertEquals(response.getStatus(), 200);
        verify(repositoryManager).getRepository("system");
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + testModel.size());
        assertEquals(response.getLinks().size(), 0);
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("bindings"));
        assertTrue(result.containsKey("data"));
        assertEquals(result.getJSONArray("data").size(), testModel.size());
    }

    @Test
    public void getPagedResultsWithDatasetTest() {
        Response response = target().path("sparql/page").queryParam("query", ALL_QUERY).queryParam("dataset", DATASET_ID)
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
        verify(datasetConnection).prepareTupleQuery(anyString());
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + testModel.size());
        assertEquals(response.getLinks().size(), 0);
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("bindings"));
        assertTrue(result.containsKey("data"));
        assertEquals(result.getJSONArray("data").size(), testModel.size());
    }

    @Test
    public void getPagedResultsWithLinksTest() {
        Response response = target().path("sparql/page").queryParam("query", ALL_QUERY)
                .queryParam("limit", 1).queryParam("offset", 1).request().get();
        assertEquals(response.getStatus(), 200);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + testModel.size());
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("sparql/page"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("bindings"));
        assertTrue(result.containsKey("data"));
        JSONArray data = result.getJSONArray("data");
        assertEquals(data.size(), 1);
    }

    @Test
    public void getPagedResultsWithNegativeOffsetTest() {
        Response response = target().path("sparql/page").queryParam("query", ALL_QUERY)
                .queryParam("offset", -1).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getPagedResultsWithNegativeLimitTest() {
        Response response = target().path("sparql/page").queryParam("query", ALL_QUERY)
                .queryParam("limit", -1).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getPagedResultsWithOffsetThatIsTooLargeTest() {
        Response response = target().path("sparql/page").queryParam("query", ALL_QUERY)
                .queryParam("offset", 10).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getPagedResultsRepositoryUnavailableTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path("sparql/page").queryParam("query", ALL_QUERY).request().get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void getPagedResultsWithDatasetThatDoesNotExistTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path("sparql/page").queryParam("query", ALL_QUERY).queryParam("dataset", DATASET_ID)
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getPagedResultsWithInvalidQueryTest() {
        Response response = target().path("sparql/page").queryParam("query", encode("+")).request().get();
        assertEquals(response.getStatus(), 400);
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("details"));

        response = target().path("sparql/page").queryParam("query", encode("+")).queryParam("dataset", DATASET_ID)
                .request().get();
        assertEquals(response.getStatus(), 400);
        result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("details"));
    }
}
