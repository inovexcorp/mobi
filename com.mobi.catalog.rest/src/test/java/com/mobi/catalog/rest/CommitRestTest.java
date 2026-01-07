package com.mobi.catalog.rest;

/*-
 * #%L
 * com.mobi.catalog.rest
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
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.PagedDifference;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class CommitRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String USER_IRI = "http://mobi.com/users/tester";
    private static final String RECORD_IRI = "http://mobi.com/records/test";
    private static final String ERROR_IRI = "http://mobi.com/error";
    private static final String[] COMMIT_IRIS = new String[] {
            "http://mobi.com/commits/0",
            "http://mobi.com/commits/1",
            "http://mobi.com/commits/2"
    };
    private static final String[] ENTITY_IRI = new String[] {
            "http://mobi.com/commits/1"
    };
    private static final String[] SUBJECT_IRI = new String[] {
            "http://mobi.com/MyTestClass"
    };

    private static CommitRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private OrmFactory<Record> recordFactory;
    private Record testRecord;
    private List<Commit> entityCommits;
    private List<Commit> testCommits;
    private User user;
    private IRI typeIRI;

    // Mock services used in server
    private static DifferenceManager differenceManager;
    private static CommitManager commitManager;
    private static CompiledResourceManager compiledResourceManager;
    private static EngineManager engineManager;
    private static BNodeService bNodeService;
    private static CatalogConfigProvider configProvider;

    @Mock
    private PaginatedSearchResults<Record> results;

    @Mock
    private Conflict conflict;

    @Mock
    private Difference difference;

    @Mock
    private OsgiRepository repo;

    @Mock
    private RepositoryConnection conn;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        mf = getModelFactory();
        
        differenceManager = Mockito.mock(DifferenceManager.class);
        commitManager = Mockito.mock(CommitManager.class);
        compiledResourceManager = Mockito.mock(CompiledResourceManager.class);
        engineManager = Mockito.mock(EngineManager.class);
        bNodeService = Mockito.mock(BNodeService.class);
        configProvider = Mockito.mock(CatalogConfigProvider.class);

        rest = new CommitRest();
        injectOrmFactoryReferencesIntoService(rest);
        rest.engineManager = engineManager;
        rest.bNodeService = bNodeService;
        rest.differenceManager = differenceManager;
        rest.commitManager = commitManager;
        rest.compiledResourceManager = compiledResourceManager;
        rest.configProvider = configProvider;

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setupMocks() throws Exception {
        typeIRI = vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
        recordFactory = getRequiredOrmFactory(Record.class);
        OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

        testCommits = Arrays.stream(COMMIT_IRIS)
                .map(s -> commitFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toList());
        entityCommits = Arrays.stream(ENTITY_IRI)
                .map(s -> commitFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toList());

        testRecord = recordFactory.createNew(vf.createIRI(RECORD_IRI));
        testRecord.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));

        user = userFactory.createNew(vf.createIRI(USER_IRI));

        closeable = MockitoAnnotations.openMocks(this);
        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgument(0, Model.class));
        when(bNodeService.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgument(0, Statement.class));
        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgument(0, Model.class));

        when(results.page()).thenReturn(Collections.singletonList(testRecord));
        when(results.pageNumber()).thenReturn(0);
        when(results.pageSize()).thenReturn(10);
        when(results.totalSize()).thenReturn(50);

        when(commitManager.getCommit(eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class))).thenReturn(Optional.of(testCommits.get(0)));
        when(commitManager.getCommit(eq(vf.createIRI(COMMIT_IRIS[1])), any(RepositoryConnection.class))).thenReturn(Optional.of(testCommits.get(1)));
        when(commitManager.getCommit(eq(vf.createIRI(COMMIT_IRIS[2])), any(RepositoryConnection.class))).thenReturn(Optional.of(testCommits.get(2)));
        when(commitManager.getCommitChain(any(Resource.class), any(RepositoryConnection.class))).thenReturn(testCommits);
        when(differenceManager.getCommitDifference(any(Resource.class), any(RepositoryConnection.class))).thenReturn(difference);
        when(differenceManager.getCommitDifferenceForSubject(any(IRI.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(difference);
        when(differenceManager.getCommitDifferencePaged(any(Resource.class), anyInt(), anyInt(), any(RepositoryConnection.class))).thenReturn(new PagedDifference(difference, false));
        when(differenceManager.getDifference(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(difference);
        when(differenceManager.getCommitDifferencePaged(any(Resource.class), any(Resource.class), anyInt(), anyInt(), any(RepositoryConnection.class))).thenReturn(new PagedDifference(difference, false));

        when(difference.getAdditions()).thenReturn(mf.createEmptyModel());
        when(difference.getDeletions()).thenReturn(mf.createEmptyModel());

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(engineManager.getUsername(any(Resource.class))).thenReturn(Optional.of(user.getResource().stringValue()));

        when(configProvider.getRepository()).thenReturn(repo);
        when(repo.getConnection()).thenReturn(conn);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        reset(commitManager, compiledResourceManager, commitManager, differenceManager, engineManager, conflict, difference, results, bNodeService, configProvider);
    }

    // GET commits/{commitId}
    @Test
    public void getCommitTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(COMMIT_IRIS[1]), conn);
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertFalse(result.has("commit"));
            assertFalse(result.has("additions"));
            assertFalse(result.has("deletions"));
            assertTrue(result.has("@id"));
            assertEquals(COMMIT_IRIS[1], result.get("@id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitWithNoResults() {
        // Setup:
        when(commitManager.getCommit(any(), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        // When:
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]))
                .request().get();

        // Then:
        assertEquals(404, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(COMMIT_IRIS[1]), conn);
    }

    @Test
    public void getCommitWithErrorTest() {
        // Setup:
        when(commitManager.getCommit(vf.createIRI(ERROR_IRI), conn)).thenThrow(new IllegalArgumentException());

        Response response = target().path("commits/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET commits/{commitId}/history
    @Test
    public void getCommitHistoryTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]), conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), String.valueOf(COMMIT_IRIS.length));
        assertEquals(response.getLinks().size(), 0);
        try {
            ArrayNode array = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(array.size(), COMMIT_IRIS.length);
            array.forEach(result -> {
                assertTrue(result.has("id"));
                assertTrue(Arrays.asList(COMMIT_IRIS).contains(result.get("id").asText()));
            });
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitHistoryWithPaginationTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]), conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), String.valueOf(COMMIT_IRIS.length));
        assertEquals(response.getLinks().size(), 0);
        try {
            ArrayNode array = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(array.size(), COMMIT_IRIS.length);
            array.forEach(result -> {
                assertTrue(result.has("id"));
                assertTrue(Arrays.asList(COMMIT_IRIS).contains(result.get("id").asText()));
            });
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitHistoryWithPaginationAndLinksTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .queryParam("offset", 1)
                .queryParam("limit", 1)
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]), conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), String.valueOf(COMMIT_IRIS.length));
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("commits/" + encode(COMMIT_IRIS[1]) + "/history"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(result.size(), 1);
            JsonNode commitObj = result.get(0);
            assertTrue(commitObj.has("id"));
            assertEquals(COMMIT_IRIS[1], commitObj.get("id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitHistoryWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).getCommitChain(vf.createIRI(ERROR_IRI), conn);

        Response response = target().path("commits/" + encode(ERROR_IRI) + "/history")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getCommitHistoryWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(commitManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]), conn);

        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(commitManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]), conn);
        response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET commits/{commitId}/resource
    @Test
    public void getCompiledResourceNoEntityTest() {
        Model expected = mf.createEmptyModel();
        expected.add(vf.createIRI(COMMIT_IRIS[0]), typeIRI, vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        expected.add(vf.createIRI(COMMIT_IRIS[1]), typeIRI, vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        expected.add(vf.createIRI(COMMIT_IRIS[2]), typeIRI, vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"));

        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(RepositoryConnection.class))).thenReturn(expected);
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/resource")
                .request().get();
        assertEquals(200, response.getStatus());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            JsonNode commitObj = result.get(0);
            assertTrue(commitObj.has("@id"));
            assertEquals(COMMIT_IRIS[0], commitObj.get("@id").asText());
            assertEquals(3, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCompiledResourceWithEntityTest() {
        Model expected = mf.createEmptyModel();
        expected.add(vf.createIRI("http://www.w3.org/2002/07/owl#Ontology"), typeIRI, vf.createIRI(COMMIT_IRIS[1]));
        when(commitManager.getCommitEntityChain(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(entityCommits);
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(RepositoryConnection.class), any(Resource.class))).thenReturn(expected);
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/resource")
                .queryParam("entityId", encode("http://www.w3.org/2002/07/owl#Ontology")).request().get();
        assertEquals(200, response.getStatus());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            JsonNode commitObj = result.get(0);
            assertTrue(commitObj.has("@id"));
            assertEquals(1, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCompiledResourceEmptyModelTest() {
        List<Commit> emptyList = new ArrayList<>();
        Model expected = mf.createEmptyModel();
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(RepositoryConnection.class), any(Resource.class))).thenReturn(expected);
        when(commitManager.getCommitEntityChain(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(emptyList);
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/resource")
                .queryParam("entityId", encode("http://mobi.com/test/empty")).request().get();
        assertEquals(200, response.getStatus());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(0, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    // GET commits/{commitId}/difference
    @Test
    public void getDifferenceTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference")
                .queryParam("targetId", encode(COMMIT_IRIS[0])).request().get();
        assertEquals(200, response.getStatus());
        verify(differenceManager).getDifference(eq(vf.createIRI(COMMIT_IRIS[1])), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDifferenceWithLimit() {
        // When
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference")
                .queryParam("targetId", encode(COMMIT_IRIS[0]))
                .queryParam("limit", 100).queryParam("offset", 0).request().get();

        // Then
        assertEquals(200, response.getStatus());
        verify(differenceManager).getCommitDifferencePaged(eq(vf.createIRI(COMMIT_IRIS[1])), eq(vf.createIRI(COMMIT_IRIS[0])), eq(100), eq(0), any(RepositoryConnection.class));
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
            assertTrue(response.getHeaders().keySet().contains("Has-More-Results"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDifferenceWithoutTargetTest() {
        // When
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference").request().get();

        // Then
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(COMMIT_IRIS[1]), conn);
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("commit"));
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
            JsonNode commit = result.get("commit");
            assertTrue(commit.has("@id"));
            assertEquals(COMMIT_IRIS[1], commit.get("@id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDifferenceWithMissingSourceNoTarget() {
        // Setup:
        when(commitManager.getCommit(any(), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        // When:
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference")
                .request().get();

        // Then:
        assertEquals(404, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(COMMIT_IRIS[1]), conn);
    }

    @Test
    public void getDifferenceWithErrorTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(differenceManager).getDifference(eq(vf.createIRI(ERROR_IRI)), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        Response response = target().path("commits/" + encode(ERROR_IRI) + "/difference")
                .queryParam("targetId", encode(COMMIT_IRIS[0])).request().get();
        assertEquals(400, response.getStatus());

        doThrow(new MobiException()).when(differenceManager).getDifference(eq(vf.createIRI(COMMIT_IRIS[1])), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference")
                .queryParam("targetId", encode(COMMIT_IRIS[0])).request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(differenceManager).getDifference(eq(vf.createIRI(COMMIT_IRIS[1])), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference")
                .queryParam("targetId", encode(COMMIT_IRIS[0])).request().get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void getDifferenceWithNoTargetWithLimit() {
        // When
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference")
                .queryParam("limit", 100).queryParam("offset", 0).request().get();

        // Then
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(COMMIT_IRIS[1]), conn);
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("commit"));
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
            JsonNode commit = result.get("commit");
            assertTrue(commit.has("@id"));
            assertEquals(COMMIT_IRIS[1], commit.get("@id").asText());
            assertTrue(response.getHeaders().containsKey("Has-More-Results"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    // GET commits/{commitId}/difference/{subjectId}
    @Test
    public void getDifferenceForSubjectTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference/" + encode(SUBJECT_IRI[0]))
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(COMMIT_IRIS[1]), conn);
        verify(differenceManager).getCommitDifferenceForSubject(eq(vf.createIRI(SUBJECT_IRI[0])), eq(vf.createIRI(COMMIT_IRIS[1])), any(RepositoryConnection.class));
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDifferenceForSubjectWithErrorTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(differenceManager).getCommitDifferenceForSubject(eq(vf.createIRI(SUBJECT_IRI[0])), eq(vf.createIRI(COMMIT_IRIS[1])), any(RepositoryConnection.class));
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference/" + encode(SUBJECT_IRI[0]))
                .request().get();
        verify(commitManager).getCommit(vf.createIRI(COMMIT_IRIS[1]), conn);
        assertEquals(400, response.getStatus());

        doThrow(new MobiException()).when(differenceManager).getCommitDifferenceForSubject(eq(vf.createIRI(SUBJECT_IRI[0])), eq(vf.createIRI(COMMIT_IRIS[1])), any(RepositoryConnection.class));
        response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference/" + encode(SUBJECT_IRI[0]))
                .request().get();
        verify(commitManager, times(2)).getCommit(vf.createIRI(COMMIT_IRIS[1]), conn);
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(differenceManager).getCommitDifferenceForSubject(eq(vf.createIRI(SUBJECT_IRI[0])), eq(vf.createIRI(COMMIT_IRIS[1])), any(RepositoryConnection.class));
        response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference/" + encode(SUBJECT_IRI[0]))
                .request().get();
        verify(commitManager, times(3)).getCommit(vf.createIRI(COMMIT_IRIS[1]), conn);
        assertEquals(500, response.getStatus());
    }

    @Test
    public void getDifferenceForSubjectWithMissingSourceTest() {
        // Setup:
        when(commitManager.getCommit(any(), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        // When:
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/difference/" + encode(SUBJECT_IRI[0]))
                .request().get();

        // Then:
        assertEquals(404, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(COMMIT_IRIS[1]), conn);
    }

    // GET commits/{commitId}/history?entityId
    @Test
    public void getCommitHistoryWithEntityNoTargetTest() {
        when(commitManager.getCommitEntityChain(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(entityCommits);
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .queryParam("entityId", encode(vf.createIRI("http://mobi.com/test/class5")))
                .queryParam("offset", 0)
                .queryParam("limit", 1)
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommitEntityChain(vf.createIRI(COMMIT_IRIS[1]), vf.createIRI("http://mobi.com/test/class5"), conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + ENTITY_IRI.length);
        assertEquals(response.getLinks().size(), 0);
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 0);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("commits/" + encode(COMMIT_IRIS[1]) + "/history"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(result.size(), 1);
            JsonNode commitObj = result.get(0);
            assertTrue(commitObj.has("id"));
            assertEquals(COMMIT_IRIS[1], commitObj.get("id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitHistoryWithEntityAndTargetTest() {
        when(commitManager.getCommitEntityChain(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(entityCommits);
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .queryParam("targetId", encode(COMMIT_IRIS[0]))
                .queryParam("entityId", encode(vf.createIRI("http://mobi.com/test/class5")))
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommitEntityChain(vf.createIRI(COMMIT_IRIS[1]), vf.createIRI(COMMIT_IRIS[0]), vf.createIRI("http://mobi.com/test/class5"), conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + ENTITY_IRI.length);
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 0);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("commits/" + encode(COMMIT_IRIS[1]) + "/history"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(result.size(), 1);
            JsonNode commitObj = result.get(0);
            assertTrue(commitObj.has("id"));
            assertEquals(COMMIT_IRIS[1], commitObj.get("id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }
}
