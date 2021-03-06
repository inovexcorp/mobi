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

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.atLeast;
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
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.persistence.utils.impl.SimpleBNodeService;
import com.mobi.persistence.utils.impl.SimpleSesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.repository.impl.sesame.query.utils.QueryResultsIOService;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.sparql.rest.SparqlRest;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Assert;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class SparqlRestTest extends MobiRestTestNg {
    private SparqlRest rest;
    private Repository repo;
    private ValueFactory vf;
    private ModelFactory mf;
    private SesameTransformer st;
    private BNodeService bns;

    private String ALL_QUERY;
    private String CONSTRUCT_QUERY;
    private String DATASET_ID;
    private Model testModel;

    private RepositoryConnection conn;
    private RepositoryConnection connLarge;
    private Map<String, String[]> fileTypesMimes;
    private Map<String, String[]> selectFileTypesMimes;
    private Map<String, String[]> constructFileTypesMimes;
    private Map<String, String[]> limitedFileTypesMimes;
    private List<String> datasets;
    private List<String> filenames;

    public static final String SPARQL_LIMITED_RESULTS_URL = "sparql/limited-results";
    public static final String SPARQL_URL = "sparql";

    @Mock
    private RepositoryManager repositoryManager;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private DatasetConnection datasetConnection;

    @Mock
    private SesameTransformer sesameTransformer;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        st = new SimpleSesameTransformer();

        SimpleBNodeService bns = new SimpleBNodeService();
        bns.setModelFactory(mf);
        bns.setValueFactory(vf);

        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        testModel = mf.createModel();
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyA"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyB"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyC"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyD"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyE"), vf.createLiteral("true"));
        conn = repo.getConnection();
        conn.add(testModel);

        MockitoAnnotations.initMocks(this);

        rest = new SparqlRest();
        rest.setRepository(repositoryManager);
        rest.setDatasetManager(datasetManager);
        rest.setSesameTransformer(sesameTransformer);
        rest.setValueFactory(vf);
        rest.setQueryResultsIO(new QueryResultsIOService());
        rest.setLimitResults(500);

        rest = Mockito.spy(rest);

        DATASET_ID = "http://example.com/datasets/0";

        ALL_QUERY = ResourceUtils.encode(IOUtils.toString(getClass().getClassLoader()
                .getResourceAsStream("all_query.rq"), StandardCharsets.UTF_8));
        CONSTRUCT_QUERY = ResourceUtils.encode(IOUtils.toString(getClass().getClassLoader()
                .getResourceAsStream("construct_query.rq"), StandardCharsets.UTF_8));

        fileTypesMimes = new LinkedHashMap<>();
        constructFileTypesMimes = new LinkedHashMap<>();
        selectFileTypesMimes = new LinkedHashMap<>();
        limitedFileTypesMimes = new LinkedHashMap<>();

        selectFileTypesMimes.put("json", new String[]{"application/json", ALL_QUERY});
        selectFileTypesMimes.put("sWrongType", new String[]{"application/json", ALL_QUERY});
        fileTypesMimes.put("csv", new String[]{"text/csv", ALL_QUERY});
        fileTypesMimes.put("tsv", new String[]{"text/tab-separated-values", ALL_QUERY});
        fileTypesMimes.put("xls", new String[]{"application/vnd.ms-excel", ALL_QUERY});
        fileTypesMimes.put("xlsx", new String[]{"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ALL_QUERY});

        constructFileTypesMimes.put("ttl", new String[]{"text/turtle", CONSTRUCT_QUERY});
        constructFileTypesMimes.put("cWrongType", new String[]{"text/turtle", CONSTRUCT_QUERY});
        constructFileTypesMimes.put("jsonld", new String[]{"application/ld+json", CONSTRUCT_QUERY});
        constructFileTypesMimes.put("rdf", new String[]{"application/rdf+xml", CONSTRUCT_QUERY});

        fileTypesMimes.putAll(constructFileTypesMimes);
        fileTypesMimes.putAll(selectFileTypesMimes);
        limitedFileTypesMimes.putAll(constructFileTypesMimes);
        limitedFileTypesMimes.putAll(selectFileTypesMimes);

        datasets = Arrays.asList(null, DATASET_ID);
        filenames = Arrays.asList(null, "test");
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
        reset(repositoryManager, datasetConnection, datasetManager, sesameTransformer);

        // mock getRepository
        when(repositoryManager.getRepository(anyString()))
                .thenReturn(Optional.of(repo));
        // mock getConnection
        when(datasetManager.getConnection(any(Resource.class)))
                .thenReturn(datasetConnection);
        // mock prepareTupleQuery
        when(datasetConnection.prepareTupleQuery(anyString()))
                .thenAnswer(i -> conn.prepareTupleQuery(i.getArgumentAt(0, String.class)));
        // mock prepareGraphQuery
        when(datasetConnection.prepareGraphQuery(anyString()))
                .thenAnswer(i -> conn.prepareGraphQuery(i.getArgumentAt(0, String.class)));

        // mock sesameTransformer
        when(sesameTransformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class)))
                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(sesameTransformer.mobiIRI(any(org.eclipse.rdf4j.model.IRI.class)))
                .thenAnswer(i -> Values.mobiIRI(i.getArgumentAt(0, org.eclipse.rdf4j.model.IRI.class)));
        when(sesameTransformer.sesameModel(any(Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(sesameTransformer.sesameStatement(any(Statement.class)))
                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
    }

    private void setupLargeRepo() {
        Repository repoLarge = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repoLarge.initialize();
        Model testModelLarge = mf.createModel();

        for (int i = 0; i <= 1000; i++) {
            testModelLarge.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/property" + i), vf.createLiteral("true"));
        }
        connLarge = repoLarge.getConnection();
        connLarge.add(testModelLarge);

        reset(repositoryManager, datasetConnection, datasetManager);
        // mock repositoryManager
        when(repositoryManager.getRepository(anyString()))
                .thenReturn(Optional.of(repoLarge));

        // mock getConnection
        when(datasetManager.getConnection(any(Resource.class)))
                .thenReturn(datasetConnection);
        // mock prepareTupleQuery
        when(datasetConnection.prepareTupleQuery(anyString()))
                .thenAnswer(i -> connLarge.prepareTupleQuery(i.getArgumentAt(0, String.class)));
        when(datasetConnection.prepareGraphQuery(anyString()))
                .thenAnswer(i -> connLarge.prepareGraphQuery(i.getArgumentAt(0, String.class)));
    }

    @Test
    public void queryRdfTest() {
        Assert.assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;

        for (String dataset : datasets) {
            for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                minNumberOfInvocations += 1;
                String type = (String) mapEntry.getKey();
                String[] dataArray = (String[]) mapEntry.getValue();
                String mimeType = dataArray[0];

                WebTarget webTarget = target().path(SPARQL_URL).queryParam("query", dataArray[1]);

                if (dataset != null) {
                    webTarget = webTarget.queryParam("dataset", DATASET_ID);
                }
                Response response = webTarget.request().accept(mimeType).get();

                assertEquals(response.getStatus(), 200);

                verify(rest, atLeast(minNumberOfInvocations)).queryRdf(anyString(), anyString(), anyString());

                if (dataset != null) {
                    verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
                    if (dataArray[1].equals(CONSTRUCT_QUERY)) {
                        verify(datasetConnection, atLeastOnce()).prepareGraphQuery(anyString());
                    } else {
                        verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
                    }
                } else {
                    verify(repositoryManager, atLeastOnce()).getRepository("system");
                }

                MultivaluedMap<String, Object> headers = response.getHeaders();
                assertEquals(headers.get("Content-Type").get(0), mimeType);

                if (type.equals("sWrongType")) {
                    type = "json";
                } else if (type.equals("cWrongType")) {
                    type = "ttl";
                }

                Assert.assertEquals(null, response.getHeaderString("Content-Disposition"));

                if (type.equals("json")) {
                    JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
                    assertTrue(result.containsKey("head"), "Response JSON contains `head` key");
                    assertTrue(result.containsKey("results"), "Response JSON contains `results` key");
                } else {
                    String responseString = response.readEntity(String.class);
                    Assert.assertNotEquals(responseString, "");
                }
            }
        }
        Assert.assertEquals("Verify minNumberOfInvocations", 20, minNumberOfInvocations);
    }

    @Test
    public void downloadQueryTest() {
        Assert.assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;
        for (String filename : filenames) {
            for (String dataset : datasets) {
                for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                    minNumberOfInvocations += 1;

                    String type = (String) mapEntry.getKey();
                    String[] dataArray = (String[]) mapEntry.getValue();
                    WebTarget webTarget = target().path(SPARQL_URL)
                            .queryParam("query", dataArray[1])
                            .queryParam("fileType", type);

                    if (filename != null) {
                        webTarget = webTarget.queryParam("fileName", filename);
                    }

                    if (dataset != null) {
                        webTarget = webTarget.queryParam("dataset", DATASET_ID);
                    }
                    Response response = webTarget.request().get();

                    verify(rest, atLeast(minNumberOfInvocations)).downloadRdfQuery(anyString(), anyString(),
                            anyString(), anyString(), anyString());

                    if (dataset != null) {
                        verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
                        if (dataArray[1].equals(CONSTRUCT_QUERY)) {
                            verify(datasetConnection, atLeastOnce()).prepareGraphQuery(anyString());
                        } else {
                            verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
                        }
                    } else {
                        verify(repositoryManager, atLeastOnce()).getRepository("system");
                    }

                    MultivaluedMap<String, Object> headers = response.getHeaders();
                    assertEquals(headers.get("Content-Type").get(0), dataArray[0]);

                    if (type.equals("sWrongType")) {
                        type = "json";
                    } else if (type.equals("cWrongType")) {
                        type = "ttl";
                    }

                    if (filename != null) {
                        assertEquals(headers.get("Content-Disposition").get(0),
                                "attachment;filename=" + filename + "." + type);
                    } else {
                        assertEquals(headers.get("Content-Disposition").get(0),
                                "attachment;filename=results." + type);
                    }

                    assertEquals(response.getStatus(), 200);

                    if (type.equals("json")) {
                        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
                        assertTrue(result.containsKey("head"), "Response JSON contains `head` key");
                        assertTrue(result.containsKey("results"), "Response JSON contains `results` key");
                    } else {
                        String responseString = response.readEntity(String.class);
                        Assert.assertNotEquals(responseString, "");
                    }
                }
            }
        }
        Assert.assertEquals("Verify minNumberOfInvocations", 40, minNumberOfInvocations);
    }

    @Test
    public void selectQueryDefaultTest() {
        int minNumberOfInvocations = 0;
        for (String dataset : datasets) {
            minNumberOfInvocations += 1;
            WebTarget webTarget = target().path(SPARQL_URL)
                    .queryParam("query", ALL_QUERY);

            if (dataset != null) {
                webTarget = webTarget.queryParam("dataset", DATASET_ID);
            }

            Response response = webTarget.request().get();

            verify(rest, atLeast(minNumberOfInvocations)).downloadRdfQuery(anyString(), anyString(),
                    anyString(), anyString(), anyString());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }

            assertEquals(response.getStatus(), 200);
            assertEquals(response.getHeaderString("Content-Type"), MediaType.APPLICATION_JSON);

            String responseString = response.readEntity(String.class);
            JSONObject result = JSONObject.fromObject(responseString);
            assertTrue(result.containsKey("head"), "Response JSON contains `head` key");
            assertTrue(result.containsKey("results"), "Response JSON contains `results` key");
        }
    }

    @Test
    public void constructQueryDefaultTest() {
        int minNumberOfInvocations = 0;
        for (String dataset : datasets) {
            minNumberOfInvocations += 1;
            WebTarget webTarget = target().path(SPARQL_URL)
                    .queryParam("query", CONSTRUCT_QUERY);

            if (dataset != null) {
                webTarget = webTarget.queryParam("dataset", DATASET_ID);
            }

            Response response = webTarget.request().get();

            verify(rest, atLeast(minNumberOfInvocations)).downloadRdfQuery(anyString(), anyString(), anyString(),
                    anyString(), anyString());
            assertEquals(response.getStatus(), 200);

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareGraphQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }

            assertEquals(response.getHeaderString("Content-Disposition"), "attachment;filename=results.ttl");
            assertEquals(response.getHeaderString("Content-Type"), "text/turtle");

            String responseString = response.readEntity(String.class);
            Assert.assertNotEquals(responseString, "");
        }
    }

    @Test
    public void selectQueryRepositoryUnavailableTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void constructQueryRepositoryUnavailableTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", CONSTRUCT_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void selectQueryWithDatasetThatDoesNotExistTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void constructQueryWithDatasetThatDoesNotExistTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", CONSTRUCT_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void selectQueryWithInvalidQueryTest() {
        Response response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);

        response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void constructQueryWithInvalidQueryTest() {
        Response response = target().path(SPARQL_URL)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);

        response = target().path(SPARQL_URL)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void selectQueryWithDatasetErrorTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void constructQueryWithDatasetErrorTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void downloadQueryRepositoryUnavailableTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString()))
                .thenReturn(Optional.empty());

        fileTypesMimes.forEach((type, dataArray) -> {
            Response response = target().path(SPARQL_URL)
                    .queryParam("query", dataArray[1])
                    .queryParam("fileType", type)
                    .request().get();
            assertEquals(response.getStatus(), 500);
        });
    }

    @Test
    public void downloadQueryWithDatasetThatDoesNotExistTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class)))
                .thenThrow(new IllegalArgumentException());

        fileTypesMimes.forEach((type, dataArray) -> {
            Response response = target().path(SPARQL_URL)
                    .queryParam("query", dataArray[1])
                    .queryParam("dataset", DATASET_ID)
                    .queryParam("fileType", type)
                    .request().get();
            assertEquals(response.getStatus(), 400);
        });
    }

    @Test
    public void downloadQueryWithInvalidQueryTest() {
        Response response = target().path(SPARQL_URL)
                .queryParam("query", ResourceUtils.encode("+"))
                .request().get();

        assertEquals(response.getStatus(), 400);
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("details"));
    }

    @Test
    public void downloadQueryDatasetWithInvalidQueryTest() {
        Response response = target().path(SPARQL_URL)
                .queryParam("query", ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().get();

        assertEquals(response.getStatus(), 400);
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.containsKey("details"));
    }

    @Test
    public void selectQueryDefaultLimitedTest() {
        int minNumberOfInvocations = 0;
        for (String dataset : datasets) {
            minNumberOfInvocations += 1;
            WebTarget webTarget = target().path(SPARQL_LIMITED_RESULTS_URL)
                    .queryParam("query", ALL_QUERY);

            if (dataset != null) {
                webTarget = webTarget.queryParam("dataset", DATASET_ID);
            }

            Response response = webTarget.request().get();

            verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(anyString(), anyString(), anyString());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }
            assertEquals(response.getStatus(), 200);
            assertEquals(response.getHeaderString("Content-Type"), MediaType.APPLICATION_JSON);
            assertEquals(response.getHeaderString("X-LIMIT-EXCEEDED"), null);

            String responseString = response.readEntity(String.class);
            JSONObject result = JSONObject.fromObject(responseString);
            assertTrue(result.containsKey("head"), "Response JSON contains `head` key");
            assertTrue(result.containsKey("results"), "Response JSON contains `results` key");
        }
    }

    @Test
    public void selectQueryDefaultLimitExceededTest() {
        setupLargeRepo();

        int minNumberOfInvocations = 0;
        for (String dataset : datasets) {
            minNumberOfInvocations += 1;
            WebTarget webTarget = target().path(SPARQL_LIMITED_RESULTS_URL)
                    .queryParam("query", ALL_QUERY);

            if (dataset != null) {
                webTarget = webTarget.queryParam("dataset", DATASET_ID);
            }

            Response response = webTarget.request().get();

            verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(anyString(), anyString(), anyString());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }
            assertEquals(response.getStatus(), 200);
            assertEquals(response.getHeaderString("Content-Type"), MediaType.APPLICATION_JSON);
            assertEquals(response.getHeaderString("X-LIMIT-EXCEEDED"), "500");

            String responseString = response.readEntity(String.class);
            JSONObject result = JSONObject.fromObject(responseString);
            assertTrue(result.containsKey("head"), "Response JSON contains `head` key");
            assertTrue(result.containsKey("results"), "Response JSON contains `results` key");
        }
    }

    @Test
    public void constructQueryDefaultLimitedTest() {
        int minNumberOfInvocations = 0;
        for (String dataset : datasets) {
            minNumberOfInvocations += 1;
            WebTarget webTarget = target().path(SPARQL_LIMITED_RESULTS_URL)
                    .queryParam("query", CONSTRUCT_QUERY);

            if (dataset != null) {
                webTarget = webTarget.queryParam("dataset", DATASET_ID);
            }

            Response response = webTarget.request().get();

            verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(anyString(), anyString(), anyString());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareGraphQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }
            assertEquals(response.getStatus(), 200);
            assertEquals(response.getHeaderString("Content-Type"), "text/turtle");
            assertEquals(response.getHeaderString("X-LIMIT-EXCEEDED"), null);

            String responseString = response.readEntity(String.class);
            Assert.assertNotEquals(responseString, "");
        }
    }

    @Test
    public void constructQueryDefaultLimitExceededTest() {
        setupLargeRepo();

        int minNumberOfInvocations = 0;
        for (String dataset : datasets) {
            minNumberOfInvocations += 1;
            WebTarget webTarget = target().path(SPARQL_LIMITED_RESULTS_URL)
                    .queryParam("query", CONSTRUCT_QUERY);

            if (dataset != null) {
                webTarget = webTarget.queryParam("dataset", DATASET_ID);
            }

            Response response = webTarget.request().get();

            verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(anyString(), anyString(), anyString());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareGraphQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }
            assertEquals(response.getStatus(), 200);
            assertEquals(response.getHeaderString("Content-Type"), "text/turtle");
            assertEquals(response.getHeaderString("X-LIMIT-EXCEEDED"), "500");

            String responseString = response.readEntity(String.class);
            Assert.assertNotEquals(responseString, "");
        }
    }


    @Test
    public void limitedResultsTest() {
        Assert.assertEquals("Verify Mimes Types", 6, limitedFileTypesMimes.size());

        int minNumberOfInvocations = 0;
        for (String dataset : datasets) {
            for (Map.Entry mapEntry: limitedFileTypesMimes.entrySet()) {
                minNumberOfInvocations += 1;
                String type = (String) mapEntry.getKey();
                String[] dataArray = (String[]) mapEntry.getValue();
                String mimeType = dataArray[0];

                WebTarget webTarget = target().path(SPARQL_LIMITED_RESULTS_URL).queryParam("query", dataArray[1]);

                if (dataset != null) {
                    webTarget = webTarget.queryParam("dataset", DATASET_ID);
                }
                Response response = webTarget.request().accept(mimeType).get();

                assertEquals(response.getStatus(), 200);

                verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(anyString(), anyString(), anyString());

                if (dataset != null) {
                    verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
                    if (dataArray[1].equals(CONSTRUCT_QUERY)) {
                        verify(datasetConnection, atLeastOnce()).prepareGraphQuery(anyString());
                    } else {
                        verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
                    }
                } else {
                    verify(repositoryManager, atLeastOnce()).getRepository("system");
                }

                MultivaluedMap<String, Object> headers = response.getHeaders();
                assertEquals(headers.get("Content-Type").get(0), mimeType);

                if (type.equals("sWrongType")) {
                    type = "json";
                } else if (type.equals("cWrongType")) {
                    type = "ttl";
                }

                if (type.equals("json")) {
                    JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
                    assertTrue(result.containsKey("head"), "Response JSON contains `head` key");
                    assertTrue(result.containsKey("results"), "Response JSON contains `results` key");
                } else {
                    String responseString = response.readEntity(String.class);
                    Assert.assertNotEquals(responseString, "");
                }
            }
        }
        Assert.assertEquals("Verify minNumberOfInvocations", 12, minNumberOfInvocations);
    }



    @Test
    public void selectQueryRepositoryUnavailableLimitedTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void constructQueryRepositoryUnavailableLimitedTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", CONSTRUCT_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void selectQueryWithDatasetThatDoesNotExistLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void constructQueryWithDatasetThatDoesNotExistLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", CONSTRUCT_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void selectQueryWithInvalidQueryLimitedTest() {
        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);

        response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void constructQueryWithInvalidQueryLimitedTest() {
        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);

        response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void selectQueryWithDatasetErrorLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void constructQueryWithDatasetErrorLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 500);
    }

}
