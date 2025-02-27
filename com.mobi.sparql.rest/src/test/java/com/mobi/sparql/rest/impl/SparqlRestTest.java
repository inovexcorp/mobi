package com.mobi.sparql.rest.impl;

/*-
 * #%L
 * com.mobi.sparql.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import com.mobi.sparql.rest.SparqlRest;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.query.resultio.QueryResultIO;
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

import java.net.URLEncoder;
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
    private String ONTOLOGY_ID_0; // With branch, commit, and imports and inProgressCommit
    private String ONTOLOGY_ID_1; // With branch and inProgressCommit
    private String ONTOLOGY_ID_2; // With commit and imports
    private String ONTOLOGY_ID_3; // Just recordId
    private String BRANCH_ID;
    private String COMMIT_ID;
    private Model testModel;
    private IRI systemIRI;

    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private RepositoryConnection conn;
    private RepositoryConnection connLarge;
    private Map<String, String[]> fileTypesMimes;
    private Map<String, String[]> selectFileTypesMimes;
    private Map<String, String[]> constructFileTypesMimes;
    private Map<String, String[]> limitedFileTypesMimes;
    private List<String> recordIDs;
    private List<String> filenames;

    // Mock services used in server
    private static SparqlRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private static RepositoryManager repositoryManager;
    private static DatasetManager datasetManager;
    private static OntologyManager ontologyManager;
    private static EngineManager engineManager;
    private static CatalogConfigProvider configProvider;
    private static CommitManager commitManager;

    @Mock
    private DatasetConnection datasetConnection;

    @Mock
    private User user;

    @Mock
    private Ontology ontology;

    @Mock
    private OsgiRepository mockRepo;

    @Mock
    private RepositoryConnection mockConn;

    @Mock
    private InProgressCommit inProgressCommit;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        mf = getModelFactory();

        repositoryManager = Mockito.mock(RepositoryManager.class);
        datasetManager = Mockito.mock(DatasetManager.class);
        ontologyManager = Mockito.mock(OntologyManager.class);
        engineManager = Mockito.mock(EngineManager.class);
        configProvider = Mockito.mock(CatalogConfigProvider.class);
        commitManager = Mockito.mock(CommitManager.class);

        rest = new SparqlRest();
        rest.repositoryManager = repositoryManager;
        rest.datasetManager = datasetManager;
        rest.ontologyManager = ontologyManager;
        rest.engineManager = engineManager;
        rest.configProvider = configProvider;
        rest.commitManager = commitManager;
        rest.setLimitResults(500);

        rest = Mockito.spy(rest);
        configureServer(rest, new UsernameTestFilter());
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
        ONTOLOGY_ID_0 = "http://example.com/ontology/0";
        ONTOLOGY_ID_1 = "http://example.com/ontology/1";
        ONTOLOGY_ID_2 = "http://example.com/ontology/2";
        ONTOLOGY_ID_3 = "http://example.com/ontology/3";
        BRANCH_ID = "http://example.com/branches/0";
        COMMIT_ID = "http://example.com/commits/0";
        systemIRI = vf.createIRI("https://mobi.solutions/repos/system");

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

        recordIDs = Arrays.asList(null, DATASET_ID, ONTOLOGY_ID_0, ONTOLOGY_ID_1, ONTOLOGY_ID_2, ONTOLOGY_ID_3);
        filenames = Arrays.asList(null, "test");

        // mock getRepository
        when(repositoryManager.getRepository(any(IRI.class)))
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

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(configProvider.getRepository()).thenReturn(mockRepo);
        when(mockRepo.getConnection()).thenReturn(mockConn);
        when(commitManager.getInProgressCommitOpt(any(), any(), any(), any())).thenReturn(Optional.of(inProgressCommit));

        when(ontologyManager.retrieveOntology(any(Resource.class))).thenReturn(Optional.of(ontology));
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class))).thenReturn(Optional.of(ontology));
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(Optional.of(ontology));
        when(ontologyManager.retrieveOntologyByCommit(any(Resource.class), any(Resource.class))).thenReturn(Optional.of(ontology));
        when(ontologyManager.applyChanges(eq(ontology), eq(inProgressCommit))).thenReturn(ontology);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        reset(repositoryManager, datasetConnection, datasetManager, ontologyManager, engineManager, configProvider, commitManager);
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
        when(repositoryManager.getRepository(any(IRI.class)))
                .thenReturn(Optional.of(repoLarge));

        // mock getConnection
        when(datasetManager.getConnection(any(Resource.class)))
                .thenReturn(datasetConnection);
        // mock prepareTupleQuery
        when(datasetConnection.prepareTupleQuery(anyString()))
                .thenAnswer(i -> connLarge.prepareTupleQuery(i.getArgument(0, String.class)));
        when(datasetConnection.prepareGraphQuery(anyString()))
                .thenAnswer(i -> connLarge.prepareGraphQuery(i.getArgument(0, String.class)));
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i -> connLarge.prepareTupleQuery("SELECT * WHERE { ?s ?p ?o. }").evaluate());
        when(ontology.getGraphQueryResultsStream(anyString(), anyBoolean(), any(), anyBoolean(), any())).thenAnswer(i -> {
            try (GraphQueryResult result = connLarge.prepareGraphQuery("CONSTRUCT { ?s ?p ?o. } WHERE { ?s ?p ?o. }").evaluate()) {
                QueryResultIO.writeGraph(result, i.getArgument(2), i.getArgument(4));
            }
            return true;
        });
        when(ontology.getGraphQueryResultsStream(anyString(), anyBoolean(), any(), anyBoolean(), any(), any())).thenAnswer(i -> {
            try (GraphQueryResult result = connLarge.prepareGraphQuery("CONSTRUCT { ?s ?p ?o. } WHERE { ?s ?p ?o. }").evaluate()) {
                QueryResultIO.writeGraph(result, i.getArgument(2), i.getArgument(5));
            }
            return true;
        });
    }

    private void setupOntology() {
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenAnswer(i -> conn.prepareTupleQuery("SELECT * WHERE { ?s ?p ?o. }").evaluate());
        when(ontology.getGraphQueryResultsStream(anyString(), anyBoolean(), any(), anyBoolean(), any())).thenAnswer(i -> {
            try (GraphQueryResult result = conn.prepareGraphQuery("CONSTRUCT { ?s ?p ?o. } WHERE { ?s ?p ?o. }").evaluate()) {
                QueryResultIO.writeGraph(result, i.getArgument(2), i.getArgument(4));
            }
            return false;
        });
        when(ontology.getGraphQueryResultsStream(anyString(), anyBoolean(), any(), anyBoolean(), any(), any())).thenAnswer(i -> {
            try (GraphQueryResult result = conn.prepareGraphQuery("CONSTRUCT { ?s ?p ?o. } WHERE { ?s ?p ?o. }").evaluate()) {
                QueryResultIO.writeGraph(result, i.getArgument(2), i.getArgument(5));
            }
            return false;
        });
    }

    @Test
    public void queryRdfTest() throws Exception {
        setupOntology();
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;

        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                minNumberOfInvocations += 1;
                String type = (String) mapEntry.getKey();
                String[] dataArray = (String[]) mapEntry.getValue();
                String mimeType = dataArray[0];

                WebTarget webTarget = getTarget(recordId, i, false, null).queryParam("query", dataArray[1]);
                Response response = webTarget.request().accept(mimeType).get();

                assertEquals(200, response.getStatus());

                verify(rest, atLeast(minNumberOfInvocations)).queryRdf(any(), anyString(), anyString(), anyString(), any(), any(), anyBoolean(), anyBoolean(), anyString());

                if (i == 1) {
                    verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
                    if (dataArray[1].equals(CONSTRUCT_QUERY)) {
                        verify(datasetConnection, atLeastOnce()).prepareGraphQuery(anyString());
                    } else {
                        verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
                    }
                } else if (i == 2) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                    verify(configProvider, atLeastOnce()).getRepository();
                    verify(mockRepo, atLeastOnce()).getConnection();
                    verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                } else if (i == 3) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                    verify(configProvider, atLeastOnce()).getRepository();
                    verify(mockRepo, atLeastOnce()).getConnection();
                    verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                } else if (i == 4) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
                } else if (i == 5) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
                } else {
                    verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        assertEquals("Verify minNumberOfInvocations", 60, minNumberOfInvocations);
    }

    @Test
    public void postQueryRdfTest() throws Exception {
        setupOntology();
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;

        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                minNumberOfInvocations += 1;
                String type = (String) mapEntry.getKey();
                String[] dataArray = (String[]) mapEntry.getValue();
                String mimeType = dataArray[0];

                WebTarget webTarget = getTarget(recordId, i, false, null);

                Response response = webTarget.request().accept(mimeType).post(Entity.entity(
                        ResourceUtils.decode(dataArray[1]), "application/sparql-query"));

                assertEquals(200, response.getStatus());

                verify(rest, atLeast(minNumberOfInvocations)).postQueryRdf(any(), anyString(), anyString(), any(), any(), anyBoolean(), anyBoolean(), anyString(), anyString());

                if (i == 1) {
                    verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
                    if (dataArray[1].equals(CONSTRUCT_QUERY)) {
                        verify(datasetConnection, atLeastOnce()).prepareGraphQuery(anyString());
                    } else {
                        verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
                    }
                } else if (i == 2) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                    verify(configProvider, atLeastOnce()).getRepository();
                    verify(mockRepo, atLeastOnce()).getConnection();
                    verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                } else if (i == 3) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                    verify(configProvider, atLeastOnce()).getRepository();
                    verify(mockRepo, atLeastOnce()).getConnection();
                    verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                } else if (i == 4) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
                } else if (i == 5) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
                } else {
                    verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        assertEquals("Verify minNumberOfInvocations", 60, minNumberOfInvocations);
    }

    @Test
    public void postUrlEncodedQueryRdfTest() throws Exception {
        setupOntology();
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;

        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                minNumberOfInvocations += 1;
                String type = (String) mapEntry.getKey();
                String[] dataArray = (String[]) mapEntry.getValue();
                String mimeType = dataArray[0];

                Form form = new Form();
                WebTarget webTarget = getTarget(recordId, i, false, form);

                form.param("query", ResourceUtils.decode(dataArray[1]));
                Response response = webTarget.request().accept(mimeType).post(Entity.entity(form,
                        MediaType.APPLICATION_FORM_URLENCODED_TYPE));

                assertEquals(200, response.getStatus());

                verify(rest, atLeast(minNumberOfInvocations)).postUrlEncodedQueryRdf(any(), anyString(), anyString(),
                        anyString(), any(), any(), anyBoolean(), anyBoolean(), anyString());

                if (i == 1) {
                    verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
                    if (dataArray[1].equals(CONSTRUCT_QUERY)) {
                        verify(datasetConnection, atLeastOnce()).prepareGraphQuery(anyString());
                    } else {
                        verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
                    }
                } else if (i == 2) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                    verify(configProvider, atLeastOnce()).getRepository();
                    verify(mockRepo, atLeastOnce()).getConnection();
                    verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                } else if (i == 3) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                    verify(configProvider, atLeastOnce()).getRepository();
                    verify(mockRepo, atLeastOnce()).getConnection();
                    verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                } else if (i == 4) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
                } else if (i == 5) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
                } else {
                    verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        assertEquals("Verify minNumberOfInvocations", 60, minNumberOfInvocations);
    }

    @Test
    public void downloadQueryTest() throws Exception {
        setupOntology();
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;
        for (String filename : filenames) {
            for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
                for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                    minNumberOfInvocations += 1;

                    String type = (String) mapEntry.getKey();
                    String[] dataArray = (String[]) mapEntry.getValue();
                    WebTarget webTarget = getTarget(recordId, i, false, null)
                            .queryParam("query", dataArray[1])
                            .queryParam("fileType", type);

                    if (filename != null) {
                        webTarget = webTarget.queryParam("fileName", filename);
                    }

                    Response response = webTarget.request().accept(MediaType.APPLICATION_OCTET_STREAM).get();

                    verify(rest, atLeast(minNumberOfInvocations)).downloadRdfQuery(any(), anyString(), anyString(), anyString(),
                            any(), any(), anyBoolean(), anyBoolean(), any(), anyString(), anyString());

                    if (i == 1) {
                        verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
                        if (dataArray[1].equals(CONSTRUCT_QUERY)) {
                            verify(datasetConnection, atLeastOnce()).prepareGraphQuery(anyString());
                        } else {
                            verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
                        }
                    } else if (i == 2) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                        verify(configProvider, atLeastOnce()).getRepository();
                        verify(mockRepo, atLeastOnce()).getConnection();
                        verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                    } else if (i == 3) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                        verify(configProvider, atLeastOnce()).getRepository();
                        verify(mockRepo, atLeastOnce()).getConnection();
                        verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                    } else if (i == 4) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
                    } else if (i == 5) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
                    } else {
                        verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        assertEquals("Verify minNumberOfInvocations", 120, minNumberOfInvocations);
    }

    @Test
    public void downloadQueryPostTest() throws Exception {
        setupOntology();
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;
        for (String filename : filenames) {
            for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
                for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                    minNumberOfInvocations += 1;

                    String type = (String) mapEntry.getKey();
                    String[] dataArray = (String[]) mapEntry.getValue();

                    WebTarget webTarget = getTarget(recordId, i, false, null)
                            .queryParam("fileType", type);

                    if (filename != null) {
                        webTarget = webTarget.queryParam("fileName", filename);
                    }

                    Response response = webTarget.request()
                            .header("accept", MediaType.APPLICATION_OCTET_STREAM)
                            .post(Entity.entity(ResourceUtils.decode(dataArray[1]), "application/sparql-query"));

                    verify(rest, atLeast(minNumberOfInvocations)).postDownloadRdfQuery(any(), anyString(), anyString(),
                            any(), any(), anyBoolean(), anyBoolean(), any(), anyString(), anyString(), anyString());

                    if (i == 1) {
                        verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
                        if (dataArray[1].equals(CONSTRUCT_QUERY)) {
                            verify(datasetConnection, atLeastOnce()).prepareGraphQuery(anyString());
                        } else {
                            verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
                        }
                    } else if (i == 2) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                        verify(configProvider, atLeastOnce()).getRepository();
                        verify(mockRepo, atLeastOnce()).getConnection();
                        verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                    } else if (i == 3) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                        verify(configProvider, atLeastOnce()).getRepository();
                        verify(mockRepo, atLeastOnce()).getConnection();
                        verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                    } else if (i == 4) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
                    } else if (i == 5) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
                    } else {
                        verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        assertEquals("Verify minNumberOfInvocations", 120, minNumberOfInvocations);
    }

    @Test
    public void downloadQueryPostUrlEncodedTest() throws Exception {
        setupOntology();
        assertEquals("Verify Mimes Types", 10, fileTypesMimes.size());
        int minNumberOfInvocations = 0;
        for (String filename : filenames) {
            for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
                for (Map.Entry mapEntry: fileTypesMimes.entrySet()) {
                    minNumberOfInvocations += 1;

                    String type = (String) mapEntry.getKey();
                    String[] dataArray = (String[]) mapEntry.getValue();

                    Form form = new Form();
                    form.param("query", ResourceUtils.decode(dataArray[1]));

                    WebTarget webTarget = getTarget(recordId, i , false, form)
                            .queryParam("fileType", type);

                    if (filename != null) {
                        webTarget = webTarget.queryParam("fileName", filename);
                    }

                    System.out.println(dataArray[0]);
                    Response response = webTarget.request()
                            .header("accept", MediaType.APPLICATION_OCTET_STREAM)
                            .post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED_TYPE));

                    verify(rest, atLeast(minNumberOfInvocations)).postUrlEncodedDownloadRdfQuery(any(), anyString(), anyString(),
                            anyString(), any(), any(), anyBoolean(), anyBoolean(), any(), anyString(), anyString());

                    if (i == 1) {
                        verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
                        if (dataArray[1].equals(CONSTRUCT_QUERY)) {
                            verify(datasetConnection, atLeastOnce()).prepareGraphQuery(anyString());
                        } else {
                            verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
                        }
                    } else if (i == 2) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                        verify(configProvider, atLeastOnce()).getRepository();
                        verify(mockRepo, atLeastOnce()).getConnection();
                        verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                    } else if (i == 3) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                        verify(configProvider, atLeastOnce()).getRepository();
                        verify(mockRepo, atLeastOnce()).getConnection();
                        verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                    } else if (i == 4) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
                    } else if (i == 5) {
                        verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
                    } else {
                        verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        assertEquals("Verify minNumberOfInvocations", 120, minNumberOfInvocations);
    }

    @Test
    public void selectQueryDefaultTest() throws Exception {
        setupOntology();
        int minNumberOfInvocations = 0;
        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            minNumberOfInvocations += 1;
            WebTarget webTarget = getTarget(recordId, i, false, null)
                    .queryParam("query", ALL_QUERY);

            Response response = webTarget.request().accept(MediaType.APPLICATION_OCTET_STREAM).get();

            verify(rest, atLeast(minNumberOfInvocations)).downloadRdfQuery(any(), anyString(), anyString(), anyString(),
                    any(), any(), anyBoolean(), anyBoolean(), any(), anyString(), anyString());

            if (i == 1) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else if (i == 2) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 3) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 4) {
                verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
            } else if (i == 5) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
            } else {
                verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        setupOntology();
        int minNumberOfInvocations = 0;
        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            minNumberOfInvocations += 1;
            WebTarget webTarget = getTarget(recordId, i, false, null)
                    .queryParam("query", CONSTRUCT_QUERY);

            Response response = webTarget.request().accept(MediaType.APPLICATION_OCTET_STREAM).get();

            verify(rest, atLeast(minNumberOfInvocations)).downloadRdfQuery(any(), anyString(), anyString(), anyString(),
                    any(), any(), anyBoolean(), anyBoolean(), any(), anyString(), anyString());
            assertEquals(200, response.getStatus());

            if (i == 1) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareGraphQuery(anyString());
            } else if (i == 2) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 3) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 4) {
                verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
            } else if (i == 5) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
            } else {
                verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        when(repositoryManager.getRepository(any(IRI.class))).thenReturn(Optional.empty());

        Response response = getTarget("", 0, false, null)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void constructQueryRepositoryUnavailableTest() {
        // Setup:
        when(repositoryManager.getRepository(any(IRI.class))).thenReturn(Optional.empty());

        Response response = getTarget("", 0, false, null)
                .queryParam("query", CONSTRUCT_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void selectQueryWithDatasetThatDoesNotExistTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = getTarget(DATASET_ID, 1, false, null)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void constructQueryWithDatasetThatDoesNotExistTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = getTarget(DATASET_ID, 1, false, null)
                .queryParam("query", CONSTRUCT_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void selectQueryWithInvalidQueryTest() {
        Response response = getTarget("", 0, false, null)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());

        response = getTarget("", 0, false, null)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void constructQueryWithInvalidQueryTest() {
        Response response = getTarget("", 0, false, null)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());

        response = getTarget("", 0, false, null)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void selectQueryWithDatasetErrorTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = getTarget(DATASET_ID, 1, false, null)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void constructQueryWithDatasetErrorTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = getTarget(DATASET_ID, 1, false, null)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void downloadQueryRepositoryUnavailableTest() {
        // Setup:
        when(repositoryManager.getRepository(any(IRI.class)))
                .thenReturn(Optional.empty());

        fileTypesMimes.forEach((type, dataArray) -> {
            Response response = getTarget("", 0, false, null)
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
            Response response = getTarget(DATASET_ID, 1, false, null)
                    .queryParam("query", dataArray[1])
                    .queryParam("fileType", type)
                    .request().get();
            assertEquals(400, response.getStatus());
        });
    }

    @Test
    public void downloadQueryWithInvalidQueryTest() throws Exception {
        Response response = getTarget("", 0, false, null)
                .queryParam("query", ResourceUtils.encode("+"))
                .request().get();

        assertEquals(400, response.getStatus());
        ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
        assertTrue(result.has("errorDetails"));
    }

    @Test
    public void downloadQueryDatasetWithInvalidQueryTest() throws Exception {
        Response response = getTarget("", 0, false, null)
                .queryParam("query", ResourceUtils.encode("+"))
                .queryParam("dataset", DATASET_ID)
                .request().get();

        assertEquals(400, response.getStatus());
        ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
        assertTrue(result.has("errorDetails"));
    }

    @Test
    public void selectQueryDefaultLimitedTest() throws Exception {
        setupOntology();
        int minNumberOfInvocations = 0;
        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            minNumberOfInvocations += 1;
            WebTarget webTarget = getTarget(recordId, i, true, null)
                    .queryParam("query", ALL_QUERY);

            Response response = webTarget.request().get();

            verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(any(), anyString(), anyString(), anyString(), any(), any(), anyBoolean(), anyBoolean(), anyString());

            if (i == 1) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else if (i == 2) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 3) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 4) {
                verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
            } else if (i == 5) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
            } else {
                verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        setupOntology();
        int minNumberOfInvocations = 0;
        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            minNumberOfInvocations += 1;
            WebTarget webTarget = getTarget(recordId, i, true, null);

            Response response = webTarget.request().post(Entity.entity(ResourceUtils.decode(ALL_QUERY),
                    "application/sparql-query"));

            verify(rest, atLeast(minNumberOfInvocations)).postLimitedResults(any(), anyString(), anyString(), any(), any(), anyBoolean(), anyBoolean(), anyString(), anyString());

            if (i == 1) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else if (i == 2) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 3) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 4) {
                verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
            } else if (i == 5) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
            } else {
                verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        setupOntology();
        int minNumberOfInvocations = 0;
        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            minNumberOfInvocations += 1;
            Form form = new Form();
            WebTarget webTarget = getTarget(recordId, i, true, form);

            form.param("query", ResourceUtils.decode(ALL_QUERY));

            Response response = webTarget.request().post(Entity.entity(form,
                    MediaType.APPLICATION_FORM_URLENCODED_TYPE));

            verify(rest, atLeast(minNumberOfInvocations)).postUrlEncodedLimitedResults(any(), anyString(), anyString(),
                    anyString(), any(), any(), anyBoolean(), anyBoolean(), anyString());

            if (i == 1) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else if (i == 2) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 3) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 4) {
                verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
            } else if (i == 5) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
            } else {
                verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            minNumberOfInvocations += 1;
            WebTarget webTarget = getTarget(recordId, i, true, null)
                    .queryParam("query", ALL_QUERY);

            Response response = webTarget.request().get();

            verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(any(), anyString(), anyString(), anyString(), any(), any(), anyBoolean(), anyBoolean(), anyString());

            if (i == 1) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareTupleQuery(anyString());
            } else if (i == 2) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 3) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 4) {
                verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
            } else if (i == 5) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
            } else {
                verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        setupOntology();
        int minNumberOfInvocations = 0;
        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            minNumberOfInvocations += 1;
            WebTarget webTarget = getTarget(recordId, i, true, null)
                    .queryParam("query", CONSTRUCT_QUERY);

            Response response = webTarget.request().get();

            verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(any(), anyString(), anyString(), anyString(), any(), any(), anyBoolean(), anyBoolean(), anyString());

            if (i == 1) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareGraphQuery(anyString());
            } else if (i == 2) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 3) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 4) {
                verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
            } else if (i == 5) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
            } else {
                verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            minNumberOfInvocations += 1;
            WebTarget webTarget = getTarget(recordId, i, true, null)
                    .queryParam("query", CONSTRUCT_QUERY);

            Response response = webTarget.request().get();

            verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(any(), anyString(), anyString(), anyString(), any(), any(), anyBoolean(), anyBoolean(), anyString());

            if (i == 1) {
                verify(datasetManager).getConnection(vf.createIRI(DATASET_ID));
                verify(datasetConnection).prepareGraphQuery(anyString());
            } else if (i == 2) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 3) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                verify(configProvider, atLeastOnce()).getRepository();
                verify(mockRepo, atLeastOnce()).getConnection();
                verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
            } else if (i == 4) {
                verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
            } else if (i == 5) {
                verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
            } else {
                verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        setupOntology();
        assertEquals("Verify Mimes Types", 6, limitedFileTypesMimes.size());

        int minNumberOfInvocations = 0;
        for (int i = 0; i < recordIDs.size(); i++) {
            String recordId = recordIDs.get(i);
            for (Map.Entry mapEntry: limitedFileTypesMimes.entrySet()) {
                minNumberOfInvocations += 1;
                String type = (String) mapEntry.getKey();
                String[] dataArray = (String[]) mapEntry.getValue();
                String mimeType = dataArray[0];

                WebTarget webTarget = getTarget(recordId, i, true, null).queryParam("query", dataArray[1]);

                Response response = webTarget.request().accept(mimeType).get();

                assertEquals(200, response.getStatus());

                verify(rest, atLeast(minNumberOfInvocations)).getLimitedResults(any(), anyString(), anyString(), anyString(), any(), any(), anyBoolean(), anyBoolean(), anyString());

                if (i == 1) {
                    verify(datasetManager, atLeastOnce()).getConnection(vf.createIRI(DATASET_ID));
                    if (dataArray[1].equals(CONSTRUCT_QUERY)) {
                        verify(datasetConnection, atLeastOnce()).prepareGraphQuery(anyString());
                    } else {
                        verify(datasetConnection, atLeastOnce()).prepareTupleQuery(anyString());
                    }
                } else if (i == 2) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)), eq(vf.createIRI(COMMIT_ID)));
                    verify(configProvider, atLeastOnce()).getRepository();
                    verify(mockRepo, atLeastOnce()).getConnection();
                    verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                } else if (i == 3) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)), eq(vf.createIRI(BRANCH_ID)));
                    verify(configProvider, atLeastOnce()).getRepository();
                    verify(mockRepo, atLeastOnce()).getConnection();
                    verify(commitManager, atLeastOnce()).getInProgressCommitOpt(any(), any(), any(), any());
                } else if (i == 4) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntologyByCommit(eq(vf.createIRI(recordId)), eq(vf.createIRI(COMMIT_ID)));
                } else if (i == 5) {
                    verify(ontologyManager, atLeastOnce()).retrieveOntology(eq(vf.createIRI(recordId)));
                } else {
                    verify(repositoryManager, atLeastOnce()).getRepository(systemIRI);
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
        assertEquals("Verify minNumberOfInvocations", 36, minNumberOfInvocations);
    }

    @Test
    public void selectQueryRepositoryUnavailableLimitedTest() {
        // Setup:
        when(repositoryManager.getRepository(any(IRI.class))).thenReturn(Optional.empty());

        Response response = getTarget("", 0, true, null)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void constructQueryRepositoryUnavailableLimitedTest() {
        // Setup:
        when(repositoryManager.getRepository(any(IRI.class))).thenReturn(Optional.empty());

        Response response = getTarget("", 0, true, null)
                .queryParam("query", CONSTRUCT_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void selectQueryWithDatasetThatDoesNotExistLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = getTarget(DATASET_ID, 1, true, null)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void constructQueryWithDatasetThatDoesNotExistLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = getTarget(DATASET_ID, 1, true, null)
                .queryParam("query", CONSTRUCT_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void selectQueryWithInvalidQueryLimitedTest() {
        Response response = getTarget("", 0, true, null)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());

        response = getTarget(DATASET_ID, 1, true, null)
                .queryParam("query", ALL_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void constructQueryWithInvalidQueryLimitedTest() {
        Response response = getTarget("", 0, true, null)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());

        response = getTarget(DATASET_ID, 1, true, null)
                .queryParam("query", CONSTRUCT_QUERY + "-" + ResourceUtils.encode("+"))
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void selectQueryWithDatasetErrorLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = getTarget(DATASET_ID, 1, true, null)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void constructQueryWithDatasetErrorLimitedTest() {
        // Setup:
        when(datasetManager.getConnection(any(Resource.class))).thenThrow(new MobiException());

        Response response = getTarget(DATASET_ID, 1, true, null)
                .queryParam("query", ALL_QUERY)
                .request().accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(500, response.getStatus());
    }

    private WebTarget getTarget(String resourceId, int index, boolean isLimited, Form form) {
        if (resourceId == null || index == 0) {
            resourceId = "https://mobi.solutions/repos/system";
        }
        String limited = isLimited ? "limited-results" : "";
        WebTarget target = target();
        if (index == 1) {
            target = target.path("sparql/dataset-record/" + URLEncoder.encode(resourceId, StandardCharsets.UTF_8) + "/" + limited);
        } else if (index == 2) {
            target = target.path("sparql/ontology-record/" + URLEncoder.encode(resourceId, StandardCharsets.UTF_8) + "/" + limited);
            if (form == null) {
                target = target.queryParam("branchId", BRANCH_ID)
                        .queryParam("commitId", COMMIT_ID)
                        .queryParam("includeImports", true)
                        .queryParam("applyInProgressCommit", true);
            } else {
                form.param("branchId", BRANCH_ID)
                        .param("commitId", COMMIT_ID)
                        .param("includeImports", "true")
                        .param("applyInProgressCommit", "true");
            }

        } else if (index == 3) {
            target = target.path("sparql/ontology-record/" + URLEncoder.encode(resourceId, StandardCharsets.UTF_8) + "/" + limited);
            if (form == null) {
                target = target.queryParam("branchId", BRANCH_ID)
                        .queryParam("includeImports", false)
                        .queryParam("applyInProgressCommit", true);
            } else {
                form.param("branchId", BRANCH_ID)
                        .param("includeImports", "false")
                        .param("applyInProgressCommit", "true");
            }

        } else if (index == 4) {
            target = target.path("sparql/ontology-record/" + URLEncoder.encode(resourceId, StandardCharsets.UTF_8) + "/" + limited);
            if (form == null) {
                target = target.queryParam("commitId", COMMIT_ID)
                        .queryParam("includeImports", true)
                        .queryParam("applyInProgressCommit", false);
            } else {
                form.param("commitId", COMMIT_ID)
                        .param("includeImports", "true")
                        .param("applyInProgressCommit", "false");
            }

        } else if (index == 5) {
            target = target.path("sparql/ontology-record/" + URLEncoder.encode(resourceId, StandardCharsets.UTF_8) + "/" + limited);
        } else {
            target = target.path("sparql/repository/" + URLEncoder.encode(resourceId, StandardCharsets.UTF_8) + "/" + limited);
        }

        return target;
    }
}
