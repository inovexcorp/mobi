package com.mobi.prov.rest;

/*-
 * #%L
 * com.mobi.prov.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.exception.MobiException;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
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
import java.util.List;
import java.util.Map;
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
    private OrmFactory<Activity> activityFactory;
    private OrmFactory<Entity> entityFactory;

    private String provData;
    private List<String> activityIRIs;
    private List<String> entityIRIs;
    private final String ACTIVITY_NAMESPACE = "http://test.org/activities#";
    private final String ENTITY_NAMESPACE = "http://test.org/entities#";
    private final String NULL_ACT_IRI = "http://test.org/activities#ProvActNull";
    private Map<String, List<String>> entityMap;

    // Mock services used in server
    private static ProvRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private static ProvenanceService provService;
    private static RepositoryManager repositoryManager;
    private static MemoryRepositoryWrapper repo;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        mf = getModelFactory();

        provService = Mockito.mock(ProvenanceService.class);
        
        repositoryManager = Mockito.mock(RepositoryManager.class);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        rest = new ProvRest();
        rest.setProvService(provService);
        rest.setRepositoryManager(repositoryManager);

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setUpMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        reset(provService);

        activityFactory = getRequiredOrmFactory(Activity.class);
        entityFactory = getRequiredOrmFactory(Entity.class);

        provData = IOUtils.toString(getClass().getResourceAsStream("/prov-data.ttl"), StandardCharsets.UTF_8);
        activityIRIs = IntStream.range(0, 10)
                .mapToObj(i -> ACTIVITY_NAMESPACE + "Activity" + i)
                .collect(Collectors.toList());
        Collections.reverse(activityIRIs);

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
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

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
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertActivities(result, activityIRIs);
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
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertActivities(result, activityIRIs.subList(2, 4));
            assertEntities(result, Stream.of(entityIRIs.get(1), entityIRIs.get(2), entityIRIs.get(3)).collect(Collectors.toList()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

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
