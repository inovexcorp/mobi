package com.mobi.sparql.rest.impl;

/*-
 * #%L
 * com.mobi.sparql.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.sparql.rest.SparqlRest;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Form;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class SparqlRestTest extends MobiRestTestCXF {
    private static final ObjectMapper mapper = new ObjectMapper();
    private String ALL_QUERY;
    private String CONSTRUCT_QUERY;
    private String DATASET_ID;
    private Model testModel;

    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
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

    // Mock services used in server
    private static SparqlRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private static RepositoryManager repositoryManager;
    private static DatasetManager datasetManager;

    @Mock
    private DatasetConnection datasetConnection;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        mf = getModelFactory();

        repositoryManager = Mockito.mock(RepositoryManager.class);
        datasetManager = Mockito.mock(DatasetManager.class);
        

        rest = new SparqlRest();
        rest.setRepository(repositoryManager);
        rest.setDatasetManager(datasetManager);
        rest.setLimitResults(500);

        rest = Mockito.spy(rest);
        configureServer(rest);
    }

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        reset(repositoryManager, datasetConnection, datasetManager);

        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        testModel = mf.createEmptyModel();
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyA"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyB"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyC"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyD"), vf.createLiteral("true"));
        testModel.add(vf.createIRI("http://example.com/Example"), vf.createIRI("http://example.com/propertyE"), vf.createLiteral("true"));
        conn = repo.getConnection();
        conn.add(testModel);

        DATASET_ID = "http://example.com/datasets/0";

        ALL_QUERY = ResourceUtils.encode(IOUtils.toString(Objects.requireNonNull(getClass().getClassLoader()
                .getResourceAsStream("all_query.rq")), StandardCharsets.UTF_8));
        CONSTRUCT_QUERY = ResourceUtils.encode(IOUtils.toString(Objects.requireNonNull(getClass().getClassLoader()
                .getResourceAsStream("construct_query.rq")), StandardCharsets.UTF_8));

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

        // mock getRepository
        when(repositoryManager.getRepository(anyString()))
                .thenReturn(Optional.of(repo));
        // mock getConnection
        when(datasetManager.getConnection(any(Resource.class)))
                .thenReturn(datasetConnection);
        // mock prepareTupleQuery
        when(datasetConnection.prepareTupleQuery(anyString()))
                .thenAnswer(i -> conn.prepareTupleQuery(i.getArgument(0, String.class)));
        // mock prepareGraphQuery
        when(datasetConnection.prepareGraphQuery(anyString()))
                .thenAnswer(i -> conn.prepareGraphQuery(i.getArgument(0, String.class)));
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        reset(repositoryManager, datasetConnection, datasetManager);
    }

    private void setupLargeRepo() {
        MemoryRepositoryWrapper repoLarge = new MemoryRepositoryWrapper();
        repoLarge.setDelegate(new SailRepository(new MemoryStore()));
        Model testModelLarge = mf.createEmptyModel();

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
                .thenAnswer(i -> connLarge.prepareTupleQuery(i.getArgument(0, String.class)));
        when(datasetConnection.prepareGraphQuery(anyString()))
                .thenAnswer(i -> connLarge.prepareGraphQuery(i.getArgument(0, String.class)));
    }

    @Test
    public void queryRdfTest() throws Exception {
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
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

                assertEquals(200, response.getStatus());

                verify(rest, atLeast(minNumberOfInvocations)).queryRdf(anyString(), any(), anyString());

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

                assertNull(response.getHeaderString("Content-Disposition"));

                if (type.equals("json")) {
                    ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
                    assertTrue("Response JSON contains `head` key", result.has("head"));
                    assertTrue("Response JSON contains `results` key", result.has("results"));
                } else {
                    String responseString = response.readEntity(String.class);
                    assertNotEquals(responseString, "");
                }
            }
        }
        assertEquals("Verify minNumberOfInvocations", 20, minNumberOfInvocations);
    }

    @Test
    public void postQueryRdfTest() throws Exception {
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;

        for (String dataset : datasets) {
            for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                minNumberOfInvocations += 1;
                String type = (String) mapEntry.getKey();
                String[] dataArray = (String[]) mapEntry.getValue();
                String mimeType = dataArray[0];

                WebTarget webTarget = target().path(SPARQL_URL);

                if (dataset != null) {
                    webTarget = webTarget.queryParam("dataset", DATASET_ID);
                }
                Response response = webTarget.request().accept(mimeType).post(Entity.entity(
                        ResourceUtils.decode(dataArray[1]), "application/sparql-query"));

                assertEquals(200, response.getStatus());

                verify(rest, atLeast(minNumberOfInvocations)).postQueryRdf(any(), anyString(), anyString());

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

                assertNull(response.getHeaderString("Content-Disposition"));

                if (type.equals("json")) {
                    ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
                    assertTrue("Response JSON contains `head` key", result.has("head"));
                    assertTrue("Response JSON contains `results` key", result.has("results"));
                } else {
                    String responseString = response.readEntity(String.class);
                    assertNotEquals(responseString, "");
                }
            }
        }
        assertEquals("Verify minNumberOfInvocations", 20, minNumberOfInvocations);
    }

    @Test
    public void postUrlEncodedQueryRdfTest() throws Exception {
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;

        for (String dataset : datasets) {
            for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                minNumberOfInvocations += 1;
                String type = (String) mapEntry.getKey();
                String[] dataArray = (String[]) mapEntry.getValue();
                String mimeType = dataArray[0];

                WebTarget webTarget = target().path(SPARQL_URL);

                Form form = new Form();
                form.param("query", ResourceUtils.decode(dataArray[1]));
                if (dataset != null) {
                    form.param("dataset", DATASET_ID);
                }
                Response response = webTarget.request().accept(mimeType).post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

                assertEquals(200, response.getStatus());

                verify(rest, atLeast(minNumberOfInvocations)).postUrlEncodedQueryRdf(anyString(), any(),
                        anyString());

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

                assertEquals(null, response.getHeaderString("Content-Disposition"));

                if (type.equals("json")) {
                    ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
                    assertTrue(result.has("head"));
                    assertTrue(result.has("results"));
                } else {
                    String responseString = response.readEntity(String.class);
                    assertNotEquals(responseString, "");
                }
            }
        }
        assertEquals("Verify minNumberOfInvocations", 20, minNumberOfInvocations);
    }

    @Test
    public void downloadQueryTest() throws Exception {
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
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
                    Response response = webTarget.request().accept(MediaType.APPLICATION_OCTET_STREAM).get();

                    verify(rest, atLeast(minNumberOfInvocations)).downloadRdfQuery(anyString(), any(),
                            any(), anyString(), anyString());

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

                    assertEquals(200, response.getStatus());

                    if (type.equals("json")) {
                        ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
                        assertTrue("Response JSON contains `head` key", result.has("head"));
                        assertTrue("Response JSON contains `results` key", result.has("results"));
                    } else {
                        String responseString = response.readEntity(String.class);
                        assertNotEquals(responseString, "");
                    }
                }
            }
        }
        assertEquals("Verify minNumberOfInvocations", 40, minNumberOfInvocations);
    }

    @Test
    public void downloadQueryPostTest() throws Exception {
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;
        for (String filename : filenames) {
            for (String dataset : datasets) {
                for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                    minNumberOfInvocations += 1;

                    String type = (String) mapEntry.getKey();
                    String[] dataArray = (String[]) mapEntry.getValue();

                    WebTarget webTarget = target().path(SPARQL_URL)
                            .queryParam("fileType", type);

                    if (filename != null) {
                        webTarget = webTarget.queryParam("fileName", filename);
                    }

                    if (dataset != null) {
                        webTarget = webTarget.queryParam("dataset", DATASET_ID);
                    }
                    Response response = webTarget.request()
                            .header("accept", MediaType.APPLICATION_OCTET_STREAM)
                            .post(Entity.entity(ResourceUtils.decode(dataArray[1]), "application/sparql-query"));

                    verify(rest, atLeast(minNumberOfInvocations)).postDownloadRdfQuery(any(), anyString(),
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
                        ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
                        assertTrue("Response JSON contains `head` key", result.has("head"));
                        assertTrue("Response JSON contains `results` key", result.has("results"));
                    } else {
                        String responseString = response.readEntity(String.class);
                        assertNotEquals(responseString, "");
                    }
                }
            }
        }
        assertEquals("Verify minNumberOfInvocations", 40, minNumberOfInvocations);
    }

    @Test
    public void downloadQueryPostUrlEncodedTest() throws Exception {
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;
        for (String filename : filenames) {
            for (String dataset : datasets) {
                for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                    minNumberOfInvocations += 1;

                    String type = (String) mapEntry.getKey();
                    String[] dataArray = (String[]) mapEntry.getValue();

                    Form form = new Form();
                    form.param("query", ResourceUtils.decode(dataArray[1]));
                    if (dataset != null) {
                        form.param("dataset", DATASET_ID);
                    }

                    WebTarget webTarget = target().path(SPARQL_URL)
                            .queryParam("fileType", type);

                    if (filename != null) {
                        webTarget = webTarget.queryParam("fileName", filename);
                    }

                    System.out.println(dataArray[0]);
                    Response response = webTarget.request()
                            .header("accept", MediaType.APPLICATION_OCTET_STREAM)
                            .post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

                    verify(rest, atLeast(minNumberOfInvocations)).postUrlEncodedDownloadRdfQuery(anyString(), any(),
                            any(), anyString(), anyString());

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

                    assertEquals(200, response.getStatus());

                    if (type.equals("json")) {
                        ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
                        assertTrue("Response JSON contains `head` key", result.has("head"));
                        assertTrue("Response JSON contains `results` key", result.has("results"));
                    } else {
                        String responseString = response.readEntity(String.class);
                        assertNotEquals(responseString, "");
                    }
                }
            }
        }
        assertEquals("Verify minNumberOfInvocations", 40, minNumberOfInvocations);
    }

    @Test
    public void selectQueryDefaultTest() throws Exception {
        int minNumberOfInvocations = 0;
        for (String dataset : datasets) {
            minNumberOfInvocations += 1;
            WebTarget webTarget = target().path(SPARQL_URL)
                    .queryParam("query", ALL_QUERY);

            if (dataset != null) {
                webTarget = webTarget.queryParam("dataset", DATASET_ID);
            }

            Response response = webTarget.request().accept(MediaType.APPLICATION_OCTET_STREAM).get();

            verify(rest, atLeast(minNumberOfInvocations)).downloadRdfQuery(anyString(), any(),
                    any(), anyString(), anyString());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }

            assertEquals(200, response.getStatus());
            assertEquals(MediaType.APPLICATION_JSON, response.getHeaderString("Content-Type"));

            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("head"));
            assertTrue(result.has("results"));
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

            Response response = webTarget.request().accept(MediaType.APPLICATION_OCTET_STREAM).get();

            verify(rest, atLeast(minNumberOfInvocations)).downloadRdfQuery(anyString(), any(), any(),
                    anyString(), anyString());
            assertEquals(200, response.getStatus());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareGraphQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }

            assertEquals("attachment;filename=results.ttl", response.getHeaderString("Content-Disposition"));
            assertEquals("text/turtle", response.getHeaderString("Content-Type"));

            String responseString = response.readEntity(String.class);
            assertNotEquals(responseString, "");
        }
    }

    @Test
    public void selectQueryRepositoryUnavailableTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void constructQueryRepositoryUnavailableTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", CONSTRUCT_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void selectQueryWithDatasetThatDoesNotExistTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void constructQueryWithDatasetThatDoesNotExistTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", CONSTRUCT_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void selectQueryWithInvalidQueryTest() {
        Response response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());

        response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void constructQueryWithInvalidQueryTest() {
        Response response = target().path(SPARQL_URL)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());

        response = target().path(SPARQL_URL)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void selectQueryWithDatasetErrorTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void constructQueryWithDatasetErrorTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = target().path(SPARQL_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
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
            assertEquals(500, response.getStatus());
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
            assertEquals(400, response.getStatus());
        });
    }

    @Test
    public void downloadQueryWithInvalidQueryTest() throws Exception {
        Response response = target().path(SPARQL_URL)
                .queryParam("query", ResourceUtils.encode("+"))
                .request().get();

        assertEquals(400, response.getStatus());
        ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
        assertTrue(result.has("errorDetails"));
    }

    @Test
    public void downloadQueryDatasetWithInvalidQueryTest() throws Exception {
        Response response = target().path(SPARQL_URL)
                .queryParam("query", ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().get();

        assertEquals(400, response.getStatus());
        ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
        assertTrue(result.has("errorDetails"));
    }

    @Test
    public void selectQueryDefaultLimitedTest() throws Exception {
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

            assertEquals(200, response.getStatus());
            assertEquals(MediaType.APPLICATION_JSON, response.getHeaderString("Content-Type"));
            assertNull(response.getHeaderString("X-LIMIT-EXCEEDED"));

            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue("Response JSON contains `head` key", result.has("head"));
            assertTrue("Response JSON contains `results` key", result.has("results"));
        }
    }

    @Test
    public void selectQueryPostDefaultLimitedTest() throws Exception {
        int minNumberOfInvocations = 0;
        for (String dataset : datasets) {
            minNumberOfInvocations += 1;
            WebTarget webTarget = target().path(SPARQL_LIMITED_RESULTS_URL);

            if (dataset != null) {
                webTarget = webTarget.queryParam("dataset", DATASET_ID);
            }

            Response response = webTarget.request().post(Entity.entity(ResourceUtils.decode(ALL_QUERY),
                    "application/sparql-query"));

            verify(rest, atLeast(minNumberOfInvocations)).postLimitedResults(any(), anyString(), anyString());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }

            assertEquals(200, response.getStatus());
            assertEquals(MediaType.APPLICATION_JSON, response.getHeaderString("Content-Type"));
            assertNull(response.getHeaderString("X-LIMIT-EXCEEDED"));

            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue("Response JSON contains `head` key", result.has("head"));
            assertTrue("Response JSON contains `results` key", result.has("results"));
        }
    }

    @Test
    public void selectQueryPostUrlEncodedDefaultLimitedTest() throws Exception {
        int minNumberOfInvocations = 0;
        for (String dataset : datasets) {
            minNumberOfInvocations += 1;
            WebTarget webTarget = target().path(SPARQL_LIMITED_RESULTS_URL);

            Form form = new Form();
            form.param("query", ResourceUtils.decode(ALL_QUERY));

            if (dataset != null) {
                form.param("dataset", DATASET_ID);
            }

            Response response = webTarget.request().post(Entity.entity(form,
                    MediaType.APPLICATION_FORM_URLENCODED_TYPE));

            verify(rest, atLeast(minNumberOfInvocations)).postUrlEncodedLimitedResults(anyString(), any(), anyString());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }

            assertEquals(200, response.getStatus());
            assertEquals(MediaType.APPLICATION_JSON, response.getHeaderString("Content-Type"));
            assertNull(response.getHeaderString("X-LIMIT-EXCEEDED"));

            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue("Response JSON contains `head` key", result.has("head"));
            assertTrue("Response JSON contains `results` key", result.has("results"));
        }
    }

    @Test
    public void selectQueryDefaultLimitExceededTest() throws Exception {
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
            assertEquals(200, response.getStatus());
            assertEquals(MediaType.APPLICATION_JSON, response.getHeaderString("Content-Type"));
            assertEquals("500", response.getHeaderString("X-LIMIT-EXCEEDED"));

            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("head"));
            assertTrue(result.has("results"));
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

            verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(anyString(), any(), anyString());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareGraphQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }
            assertEquals(200, response.getStatus());
            assertEquals("text/turtle", response.getHeaderString("Content-Type"));
            assertNull(response.getHeaderString("X-LIMIT-EXCEEDED"));

            String responseString = response.readEntity(String.class);
            assertNotEquals(responseString, "");
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

            verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(anyString(), any(), anyString());

            if (dataset != null) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareGraphQuery(anyString());
            } else {
                verify(repositoryManager).getRepository("system");
            }
            assertEquals(200, response.getStatus());
            assertEquals("text/turtle", response.getHeaderString("Content-Type"));
            assertEquals("500", response.getHeaderString("X-LIMIT-EXCEEDED"));

            String responseString = response.readEntity(String.class);
            assertNotEquals(responseString, "");
        }
    }

    @Test
    public void limitedResultsTest() throws Exception {
        assertEquals("Verify Mimes Types", 6, limitedFileTypesMimes.size());

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

                assertEquals(200, response.getStatus());

                verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(anyString(), any(), anyString());

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
                    ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
                    assertTrue(result.has("head"));
                    assertTrue(result.has("results"));
                } else {
                    String responseString = response.readEntity(String.class);
                    assertNotEquals(responseString, "");
                }
            }
        }
        assertEquals("Verify minNumberOfInvocations", 12, minNumberOfInvocations);
    }

    @Test
    public void selectQueryRepositoryUnavailableLimitedTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void constructQueryRepositoryUnavailableLimitedTest() {
        // Setup:
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.empty());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", CONSTRUCT_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void selectQueryWithDatasetThatDoesNotExistLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void constructQueryWithDatasetThatDoesNotExistLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", CONSTRUCT_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void selectQueryWithInvalidQueryLimitedTest() {
        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());

        response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void constructQueryWithInvalidQueryLimitedTest() {
        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());

        response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void selectQueryWithDatasetErrorLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void constructQueryWithDatasetErrorLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = target().path(SPARQL_LIMITED_RESULTS_URL)
                .queryParam("query", ALL_QUERY)
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }
}
