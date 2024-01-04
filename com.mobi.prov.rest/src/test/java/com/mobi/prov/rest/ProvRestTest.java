package com.mobi.prov.rest;

/*-
 * #%L
 * com.mobi.prov.rest
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class ProvRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private static OrmFactory<Activity> activityFactory;
    private static OrmFactory<Entity> entityFactory;

    private List<String> activityIRIs;
    private List<String> entityIRIs;
    private final String ACTIVITY_NAMESPACE = "http://test.org/activities#";
    private final String ENTITY_NAMESPACE = "http://test.org/entities#";
    private final String NULL_ACT_IRI = "http://test.org/activities#ProvActNull";
    private final String USER_IRI = "http://test.org/users#" + UsernameTestFilter.USERNAME;
    private Map<String, List<String>> entityMap;

    private static ValueFactory vf;
    private static ProvenanceService provService;
    private static RepositoryManager repositoryManager;
    private static EngineManager engineManager;
    private static PDP pdp;
    private static MemoryRepositoryWrapper repo;
    private static Request request;
    private static User user;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();

        provService = Mockito.mock(ProvenanceService.class);
        pdp = Mockito.mock(PDP.class);
        engineManager = Mockito.mock(EngineManager.class);
        request = Mockito.mock(Request.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + com.mobi.rest.util.UsernameTestFilter.USERNAME));

        repositoryManager = Mockito.mock(RepositoryManager.class);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        activityFactory = getRequiredOrmFactory(Activity.class);
        entityFactory = getRequiredOrmFactory(Entity.class);

        // Mock services used in server
        ProvRest rest = new ProvRest();
        injectOrmFactoryReferencesIntoService(rest);
        rest.provService = provService;
        rest.repositoryManager = repositoryManager;
        rest.pdp = pdp;
        rest.engineManager = engineManager;

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setUpMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        reset(provService, pdp);

        String provData = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/prov-data.ttl")), StandardCharsets.UTF_8);
        activityIRIs = IntStream.range(0, 10)
                .mapToObj(i -> ACTIVITY_NAMESPACE + "Activity" + i)
                .collect(Collectors.toList());

        entityIRIs = IntStream.range(0, 5)
                .mapToObj(i -> ENTITY_NAMESPACE + "Entity" + i)
                .collect(Collectors.toList());

        entityMap = new HashMap<>();
        entityMap.put(activityIRIs.get(0), Collections.singletonList(entityIRIs.get(0)));
        entityMap.put(activityIRIs.get(1), Collections.singletonList(entityIRIs.get(0)));
        entityMap.put(activityIRIs.get(2), Collections.singletonList(entityIRIs.get(1)));
        entityMap.put(activityIRIs.get(3), Stream.of(entityIRIs.get(2), entityIRIs.get(3)).collect(Collectors.toList()));
        entityMap.put(activityIRIs.get(4), Stream.of(entityIRIs.get(1), entityIRIs.get(2)).collect(Collectors.toList()));
        entityMap.put(activityIRIs.get(5), Collections.singletonList(entityIRIs.get(0)));
        entityMap.put(activityIRIs.get(6), Collections.singletonList(entityIRIs.get(3)));
        entityMap.put(activityIRIs.get(7), Collections.singletonList(entityIRIs.get(4)));
        entityMap.put(activityIRIs.get(8), Collections.singletonList(entityIRIs.get(4)));
        entityMap.put(activityIRIs.get(9), Stream.of(entityIRIs.get(2), entityIRIs.get(3)).collect(Collectors.toList()));

        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.of(repo));

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.clear();
            conn.add(Rio.parse(new ByteArrayInputStream(provData.getBytes()), "", RDFFormat.TURTLE));
        }

        when(provService.getConnection()).thenReturn(repo.getConnection());
        when(provService.getActivity(any(Resource.class))).thenAnswer(i -> {
            Resource resource = i.getArgument(0, Resource.class);
            if (resource.stringValue().equals(NULL_ACT_IRI)) {
                return Optional.empty();
            }
            Activity activity = activityFactory.createNew(i.getArgument(0, Resource.class));
            entityMap.get(activity.getResource().stringValue()).forEach(entityIRI -> entityFactory.createNew(vf.createIRI(entityIRI), activity.getModel()));
            return Optional.of(activity);
        });

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(pdp.createRequest(anyList(), anyMap(), anyList(), anyMap(), anyList(), anyMap())).thenReturn(request);
        when(pdp.filter(eq(request), any(IRI.class))).thenReturn(new HashSet<>(entityIRIs.subList(0, entityIRIs.size() - 1)));
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    // getActivities

    @Test
    public void getActivitiesWithNoneTest() throws Exception {
        // Setup:
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.clear();
        }

        Response response = target().path("provenance-data").request().get();
        assertEquals(response.getStatus(), 200);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "0");
        verify(provService, times(0)).getActivity(any(Resource.class));
        verify(pdp, times(0)).filter(eq(request), any(IRI.class));
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertActivities(result, new ArrayList<>());
            assertEntities(result, new ArrayList<>());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getActivitiesOnePageTest() throws Exception {
        Response response = target().path("provenance-data").request().get();
        assertEquals(response.getStatus(), 200);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "10");
        verify(provService, times(10)).getActivity(any(Resource.class));
        verify(pdp, times(0)).filter(eq(request), any(IRI.class));
        try {
            List<String> expected = new ArrayList<>(activityIRIs);
            Collections.reverse(expected);
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertActivities(result, expected);
            assertEntities(result, entityIRIs);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getActivitiesWithLinksTest() throws Exception {
        Response response = target().path("provenance-data").queryParam("limit", 2).queryParam("offset", 2).request().get();
        assertEquals(response.getStatus(), 200);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "10");
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        assertTrue(response.hasLink("prev"));
        assertTrue(response.hasLink("next"));
        verify(provService, times(2)).getActivity(any(Resource.class));
        verify(pdp, times(0)).filter(eq(request), any(IRI.class));
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertActivities(result, Stream.of(activityIRIs.get(7), activityIRIs.get(6)).collect(Collectors.toList()));
            assertEntities(result, Stream.of(entityIRIs.get(3), entityIRIs.get(4)).collect(Collectors.toList()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getActivitiesWithAgentTest() throws Exception {
        String USER_1_IRI = "http://test.org/users#1";
        Response response = target().path("provenance-data").queryParam("agent", USER_1_IRI).request().get();
        assertEquals(response.getStatus(), 200);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "6");
        verify(provService, times(6)).getActivity(any(Resource.class));
        verify(pdp, times(0)).filter(eq(request), any(IRI.class));
        try {
            List<String> expected = Stream.of(activityIRIs.get(2), activityIRIs.get(4), activityIRIs.get(5), activityIRIs.get(6), activityIRIs.get(8), activityIRIs.get(9)).collect(Collectors.toList());
            Collections.reverse(expected);
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertActivities(result, expected);
            assertEntities(result, Stream.of(entityIRIs.get(0), entityIRIs.get(1), entityIRIs.get(2), entityIRIs.get(3), entityIRIs.get(4)).collect(Collectors.toList()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getActivitiesWithEntityTest() throws Exception {
        Response response = target().path("provenance-data").queryParam("entity", entityIRIs.get(0)).request().get();
        assertEquals(response.getStatus(), 200);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "3");
        verify(provService, times(3)).getActivity(any(Resource.class));
        verify(pdp, times(0)).filter(eq(request), any(IRI.class));
        try {
            List<String> expected = Stream.of(activityIRIs.get(0), activityIRIs.get(1), activityIRIs.get(5)).collect(Collectors.toList());
            Collections.reverse(expected);
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertActivities(result, expected);
            assertEntities(result, Stream.of(entityIRIs.get(0)).collect(Collectors.toList()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getActivitiesWithRecords() {
        // Setup:
        try (RepositoryConnection conn = repo.getConnection()) {
            entityIRIs.forEach(iri -> conn.add(vf.createIRI(iri), RDF.TYPE, vf.createIRI(Record.TYPE)));
        }

        Response response = target().path("provenance-data").request().get();
        assertEquals(response.getStatus(), 200);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "8");
        verify(provService, times(8)).getActivity(any(Resource.class));
        verify(pdp).createRequest(anyList(), anyMap(), anyList(), anyMap(), anyList(), anyMap());
        verify(pdp).filter(eq(request), any(IRI.class));
        try {
            List<String> expected = Stream.of(activityIRIs.get(0), activityIRIs.get(1), activityIRIs.get(2), activityIRIs.get(3), activityIRIs.get(4), activityIRIs.get(5), activityIRIs.get(6), activityIRIs.get(9)).collect(Collectors.toList());
            Collections.reverse(expected);
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertActivities(result, expected);
            assertEntities(result, entityIRIs.subList(0, entityIRIs.size() - 1));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    // getActivity

    @Test
    public void getActivityWithoutErrorTest() {
        Response response = target().path("provenance-data/" + ResourceUtils.encode(activityIRIs.get(0))).request().get();
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void getActivityWithErrorTest() {
        Response response = target().path("provenance-data/" + NULL_ACT_IRI).request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getActivitiesWithNegativeLimitTest() {
        Response response = target().path("provenance-data").queryParam("limit", -1).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getActivitiesWithNegativeOffsetTest() {
        Response response = target().path("provenance-data").queryParam("offset", -1).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getActivitiesWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(provService).getConnection();

        Response response = target().path("provenance-data").request().get();
        assertEquals(response.getStatus(), 500);
    }

    // Helper methods

    private void assertResourceOrder(JSONArray array, List<String> expectedOrder) {
        List<String> resources = getResources(array);
        assertEquals(resources, expectedOrder);
    }

    private List<String> getResources(JSONArray array) {
        List<String> resources = new ArrayList<>();
        for (int i = 0; i < array.size(); i++) {
            JSONObject obj = array.optJSONObject(i);
            assertNotNull(obj);
            String iri = obj.optString("@id");
            assertNotNull(iri);
            resources.add(iri);
        }
        return resources;
    }

    private void assertActivities(JSONObject result, List<String> expected) {
        assertTrue(result.containsKey("activities"));
        JSONArray activities = result.optJSONArray("activities");
        assertNotNull(activities);
        assertEquals(activities.size(), expected.size());
        assertResourceOrder(activities, expected);
    }

    private void assertEntities(JSONObject result, List<String> expected) {
        assertTrue(result.containsKey("entities"));
        JSONArray entities = result.optJSONArray("entities");
        assertNotNull(entities);
        assertEquals(entities.size(), expected.size());
        List<String> resources = getResources(entities);
        assertTrue(resources.containsAll(expected));
    }
}
