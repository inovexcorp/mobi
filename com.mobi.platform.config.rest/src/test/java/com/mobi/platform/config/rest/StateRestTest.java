package com.mobi.platform.config.rest;

/*-
 * #%L
 * com.mobi.platform.config.rest
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
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.exception.MobiException;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import com.mobi.rest.util.RestUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Response;

public class StateRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private static final ObjectMapper mapper = new ObjectMapper();
    private static Map<Resource, Model> results = new HashMap<>();
    private static Resource stateId;
    private static Model stateModel;

    // Mock services used in server
    private static StateRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private static StateManager stateManager;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        mf = getModelFactory();

        stateManager = Mockito.mock(StateManager.class);

        rest = new StateRest();
        rest.setStateManager(stateManager);

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        stateId = vf.createIRI("http://mobi.com/states/0");
        stateModel = mf.createEmptyModel();
        results.put(stateId, stateModel);

        when(stateManager.getStates(anyString(), any(), anySet())).thenReturn(results);
        when(stateManager.stateExistsForUser(any(Resource.class), anyString())).thenReturn(true);
        when(stateManager.getState(any(Resource.class))).thenReturn(stateModel);
        when(stateManager.storeState(any(Model.class), anyString())).thenReturn(stateId);
        when(stateManager.storeState(any(Model.class), anyString(), anyString())).thenReturn(stateId);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        reset(stateManager);
    }

    @Test
    public void getStatesWithoutFiltersTest() {
        Response response = target().path("states").request().get();
        assertEquals(200, response.getStatus());
        verify(stateManager).getStates(anyString(), any(), anySet());
        try {
            ArrayNode arr = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(results.size(), arr.size());
            for (int i = 0; i < arr.size(); i++) {
                JsonNode object = arr.get(i);
                assertNotNull(object);
                assertTrue(results.containsKey(vf.createIRI(object.get("id").asText())));
            }
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getStatesWithFiltersTest() {
        // Setup:
        Set<Resource> subjects = IntStream.range(0, 2)
                .mapToObj(i -> "http://mobi.com/subjects/" + i)
                .map(vf::createIRI)
                .collect(Collectors.toSet());

        WebTarget webTarget = target().path("states").queryParam("application", "app");
        for (Resource subject : subjects) {
            webTarget = webTarget.queryParam("subjects", subject.stringValue());
        }
        Response response = webTarget.request().get();
        assertEquals(200, response.getStatus());
        verify(stateManager).getStates(anyString(), eq("app"), eq(subjects));
        try {
            ArrayNode arr = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(results.size(), arr.size());
            for (int i = 0; i < arr.size(); i++) {
                JsonNode object = arr.get(i);
                assertNotNull(object);
                assertTrue(results.containsKey(vf.createIRI(object.get("id").asText())));
            }
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createStateWithoutApplicationTest() {
        // Setup:
        Model state = mf.createEmptyModel();
        state.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));

        Response response = target().path("states").request().post(Entity.json(modelToJsonld(state)));
        assertEquals(201, response.getStatus());
        verify(stateManager).storeState(eq(state), anyString());
        try {
            String str = response.readEntity(String.class);
            assertEquals(str, stateId.stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createStateWithApplicationTest() {
        // Setup:
        Model state = mf.createEmptyModel();
        state.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));

        Response response = target().path("states").queryParam("application", "app")
                .request().post(Entity.json(modelToJsonld(state)));
        assertEquals(201, response.getStatus());
        verify(stateManager).storeState(eq(state), anyString(), eq("app"));
        try {
            String str = response.readEntity(String.class);
            assertEquals(str, stateId.stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createStateWithInvalidJsonldTest() {
        // Setup:
        ObjectNode state = mapper.createObjectNode().put("test", "test");

        Response response = target().path("states")
                .request().post(Entity.json(state.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getStateTest() {
        Response response = target().path("states/" + encode(stateId.stringValue())).request().get();
        assertEquals(200, response.getStatus());
        verify(stateManager).stateExistsForUser(eq(stateId), anyString());
        verify(stateManager).getState(stateId);
        try {
            String str = response.readEntity(String.class);
            assertEquals(str, modelToJsonld(stateModel));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getStateThatIsNotYoursTest() {
        // Setup:
        when(stateManager.stateExistsForUser(any(Resource.class), anyString())).thenReturn(false);

        Response response = target().path("states/" + encode(stateId.stringValue())).request().get();
        assertEquals(401, response.getStatus());
    }

    @Test
    public void getStateThatDoesNotExistTest() {
        // Setup:
        when(stateManager.getState(any(Resource.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path("states/" + encode(stateId.stringValue())).request().get();
        assertEquals(404, response.getStatus());
    }

    @Test
    public void getStateExceptionThrownTest() {
        // Setup:
        when(stateManager.getState(any(Resource.class))).thenThrow(new MobiException());

        Response response = target().path("states/" + encode(stateId.stringValue())).request().get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void updateStateTest() {
        // Setup:
        Model state = mf.createEmptyModel();
        state.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().put(Entity.json(modelToJsonld(state)));
        assertEquals(200, response.getStatus());
        verify(stateManager).stateExistsForUser(eq(stateId), anyString());
        verify(stateManager).updateState(eq(stateId), eq(state));
    }

    @Test
    public void updateStateWithInvalidJsonldTest() {
        // Setup:
        ObjectNode state = mapper.createObjectNode().put("test", "test");

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().put(Entity.json(state.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateStateThatDoesNotExistTest() {
        // Setup:
        Model state = mf.createEmptyModel();
        state.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        doThrow(new IllegalArgumentException()).when(stateManager).updateState(any(Resource.class), any(Model.class));

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().put(Entity.json(modelToJsonld(state)));
        assertEquals(404, response.getStatus());
    }

    @Test
    public void updateStateThatIsNotYoursTest() {
        // Setup:
        Model state = mf.createEmptyModel();
        state.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        when(stateManager.stateExistsForUser(any(Resource.class), anyString())).thenReturn(false);

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().put(Entity.json(modelToJsonld(state)));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void updateStateExceptionThrownTest() {
        // Setup:
        Model state = mf.createEmptyModel();
        state.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));
        doThrow(new MobiException()).when(stateManager).updateState(any(Resource.class), any(Model.class));

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().put(Entity.json(modelToJsonld(state)));
        assertEquals(500, response.getStatus());
    }

    @Test
    public void deleteStateTest() {
        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(stateManager).deleteState(eq(stateId));
    }

    @Test
    public void deleteStateThatIsNotYoursTest() {
        // Setup:
        when(stateManager.stateExistsForUser(any(Resource.class), anyString())).thenReturn(false);

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().delete();
        assertEquals(401, response.getStatus());
    }

    @Test
    public void deleteStateThatDoesNotExistTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(stateManager).deleteState(any(Resource.class));

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().delete();
        assertEquals(404, response.getStatus());
    }

    @Test
    public void deleteStateExceptionThrownTest() {
        // Setup:
        doThrow(new MobiException()).when(stateManager).deleteState(any(Resource.class));

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().delete();
        assertEquals(500, response.getStatus());
    }

    private String modelToJsonld(Model model) {
        return RestUtils.modelToJsonld(model);
    }
}
