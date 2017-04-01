package org.matonto.sparql.rest.impl;

/*-
 * #%L
 * org.matonto.sparql.rest
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

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Test;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.matonto.rest.util.MatontoRestTestNg;
import org.matonto.rest.util.RestUtils;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import javax.ws.rs.core.Application;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.matonto.rest.util.RestUtils.encode;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

public class SparqlRestImplTest extends MatontoRestTestNg {
    private SparqlRestImpl rest;
    private Repository repo;
    private ValueFactory vf;
    private ModelFactory mf;

    private String ALL_QUERY;
    private Model testModel;

    @Mock
    private RepositoryManager repositoryManager;

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
        RepositoryConnection conn = repo.getConnection();
        conn.add(testModel);
        conn.close();

        MockitoAnnotations.initMocks(this);
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.of(repo));

        rest = new SparqlRestImpl();
        rest.setRepository(repositoryManager);

        ALL_QUERY = RestUtils.encode(IOUtils.toString(getClass().getClassLoader().getResourceAsStream("all_query.rq")));

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
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
    public void downloadQueryWithInvalidQueryTest() {
        Response response = target().path("sparql").queryParam("query", RestUtils.encode("+"))
                .queryParam("fileType", "csv").request().get();
        assertEquals(response.getStatus(), 400);
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("details"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
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
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + testModel.size());
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), testModel.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
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
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("bindings"));
            assertTrue(result.containsKey("data"));
            JSONArray data = result.getJSONArray("data");
            assertEquals(data.size(), 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getPagedResultsWithNegativeOffsetTest() {
        Response response = target().path("sparql/page").queryParam("query", ALL_QUERY)
                .queryParam("offset", -1).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getPagedResultsWithNonPositiveLimitTest() {
        Response response = target().path("sparql/page").queryParam("query", ALL_QUERY)
                .queryParam("limit", 0).request().get();
        assertEquals(response.getStatus(), 400);

        response = target().path("sparql/page").queryParam("query", ALL_QUERY)
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
    public void getPagedResultsWithInvalidQueryTest() {
        Response response = target().path("sparql/page").queryParam("query", encode("+")).request().get();
        assertEquals(response.getStatus(), 400);
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("details"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }
}
