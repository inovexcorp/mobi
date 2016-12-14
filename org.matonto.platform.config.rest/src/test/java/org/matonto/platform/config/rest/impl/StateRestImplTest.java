package org.matonto.platform.config.rest.impl;

/*-
 * #%L
 * org.matonto.platform.config.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Assert;
import org.matonto.exception.MatOntoException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.platform.config.api.state.StateManager;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rest.util.MatontoRestTestNg;
import org.matonto.rest.util.UsernameTestFilter;
import org.matonto.web.security.util.AuthenticationProps;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Response;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.matonto.rest.util.RestUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anySet;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class StateRestImplTest extends MatontoRestTestNg {
    private StateRestImpl rest;
    private ValueFactory vf;
    private ModelFactory mf;

    private static Map<Resource, Model> results = new HashMap<>();
    private static Resource stateId;
    private static Model stateModel;

    @Mock
    StateManager stateManager;

    @Mock
    SesameTransformer transformer;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();

        stateId = vf.createIRI("http://matonto.org/states/0");
        stateModel = mf.createModel();
        results.put(stateId, stateModel);

        MockitoAnnotations.initMocks(this);

        when(transformer.matontoModel(any(org.openrdf.model.Model.class)))
                .thenAnswer(i -> Values.matontoModel((org.openrdf.model.Model) i.getArguments()[0]));
        when(transformer.sesameModel(any(org.matonto.rdf.api.Model.class)))
                .thenAnswer(i -> Values.sesameModel((org.matonto.rdf.api.Model) i.getArguments()[0]));

        rest = new StateRestImpl();
        rest.setStateManager(stateManager);
        rest.setModelFactory(mf);
        rest.setValueFactory(vf);
        rest.setTransformer(transformer);

        return new ResourceConfig().property(AuthenticationProps.USERNAME, "test")
                .register(rest)
                .register(UsernameTestFilter.class)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(UsernameTestFilter.class).register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(stateManager);
        when(stateManager.getStates(anyString(), anyString(), anySet())).thenReturn(results);
        when(stateManager.stateExists(any(Resource.class), anyString())).thenReturn(true);
        when(stateManager.getState(any(Resource.class), anyString())).thenReturn(stateModel);
        when(stateManager.storeState(any(Model.class), anyString())).thenReturn(stateId);
        when(stateManager.storeState(any(Model.class), anyString(), anyString())).thenReturn(stateId);
    }

    @Test
    public void getStatesWithoutFiltersTest() {
        Response response = target().path("states").request().get();
        assertEquals(200, response.getStatus());
        verify(stateManager, times(1)).getStates(anyString(), anyString(), anySet());
        try {
            String str = response.readEntity(String.class);
            JSONArray arr = JSONArray.fromObject(str);
            assertEquals(results.size(), arr.size());
            for (int i = 0; i < arr.size(); i++) {
                JSONObject object = arr.optJSONObject(i);
                assertNotNull(object);
                assertTrue(results.keySet().contains(vf.createIRI(object.get("id").toString())));
            }
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getStatesWithFiltersTest() {
        // Setup:
        Set<Resource> subjects = IntStream.range(0, 2)
                .mapToObj(i -> "http://matonto.org/subjects/" + i)
                .map(vf::createIRI)
                .collect(Collectors.toSet());

        WebTarget webTarget = target().path("states").queryParam("application", "app");
        for (Resource subject : subjects) {
            webTarget = webTarget.queryParam("subjects", subject.stringValue());
        }
        Response response = webTarget.request().get();
        assertEquals(200, response.getStatus());
        verify(stateManager, times(1)).getStates(anyString(), eq("app"), eq(subjects));
        try {
            String str = response.readEntity(String.class);
            JSONArray arr = JSONArray.fromObject(str);
            assertEquals(results.size(), arr.size());
            for (int i = 0; i < arr.size(); i++) {
                JSONObject object = arr.optJSONObject(i);
                assertNotNull(object);
                assertTrue(results.keySet().contains(vf.createIRI(object.get("id").toString())));
            }
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createStateWithoutApplicationTest() {
        // Setup:
        Model state = mf.createModel();
        state.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));

        Response response = target().path("states").request().post(Entity.json(modelToJsonld(state)));
        assertEquals(200, response.getStatus());
        verify(stateManager, times(1)).storeState(eq(state), anyString());
        try {
            String str = response.readEntity(String.class);
            assertEquals(stateId.stringValue(), str);
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createStateWithApplicationTest() {
        // Setup:
        Model state = mf.createModel();
        state.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));

        Response response = target().path("states").queryParam("application", "app")
                .request().post(Entity.json(modelToJsonld(state)));
        assertEquals(200, response.getStatus());
        verify(stateManager, times(1)).storeState(eq(state), anyString(), eq("app"));
        try {
            String str = response.readEntity(String.class);
            assertEquals(stateId.stringValue(), str);
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createStateWithInvalidJsonldTest() {
        // Setup:
        JSONObject state = new JSONObject();
        state.put("test", "test");

        Response response = target().path("states")
                .request().post(Entity.json(state.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getStateTest() {
        Response response = target().path("states/" + encode(stateId.stringValue())).request().get();
        assertEquals(200, response.getStatus());
        verify(stateManager, times(1)).getState(eq(stateId), anyString());
        try {
            String str = response.readEntity(String.class);
            assertEquals(modelToJsonld(stateModel), str);
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getStateExceptionThrownTest() {
        // Setup:
        when(stateManager.getState(any(Resource.class), anyString())).thenThrow(new MatOntoException());

        Response response = target().path("states/" + encode(stateId.stringValue())).request().get();
        assertEquals(403, response.getStatus());
    }

    @Test
    public void updateStateTest() {
        // Setup:
        Model state = mf.createModel();
        state.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().put(Entity.json(modelToJsonld(state)));
        assertEquals(200, response.getStatus());
        verify(stateManager, times(1)).updateState(eq(stateId), eq(state), anyString());
    }

    @Test
    public void updateStateWithInvalidJsonldTest() {
        // Setup:
        JSONObject state = new JSONObject();
        state.put("test", "test");

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().put(Entity.json(state.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateStateExceptionThrownTest() {
        // Setup:
        doThrow(new MatOntoException()).when(stateManager).updateState(any(Resource.class), any(Model.class), anyString());
        Model state = mf.createModel();
        state.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()), vf.createLiteral("Title"));

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().put(Entity.json(modelToJsonld(state)));
        assertEquals(403, response.getStatus());
    }

    @Test
    public void deleteStateTest() {
        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(stateManager, times(1)).deleteState(eq(stateId), anyString());
    }

    @Test
    public void deleteStateExceptionThrownTest() {
        // Setup:
        doThrow(new MatOntoException()).when(stateManager).deleteState(any(Resource.class), anyString());

        Response response = target().path("states/" + encode(stateId.stringValue()))
                .request().delete();
        assertEquals(403, response.getStatus());
    }

    private String modelToJsonld(Model model) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Rio.write(transformer.sesameModel(model), out, RDFFormat.JSONLD);
        return out.toString();
    }
}
