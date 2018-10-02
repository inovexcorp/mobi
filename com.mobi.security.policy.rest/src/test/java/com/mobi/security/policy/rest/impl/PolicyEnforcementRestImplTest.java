package com.mobi.security.policy.rest.impl;

/*-
 * #%L
 * com.mobi.security.policy.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.web.security.util.AuthenticationProps;
import net.sf.json.JSONObject;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Response;

public class PolicyEnforcementRestImplTest extends MobiRestTestNg {
    private static final String USER_IRI = "http://mobi.com/users/tester";

    private PolicyEnforcementRestImpl rest;
    private ValueFactory vf;
    private JSONObject json;

    @Mock
    private EngineManager engineManager;

    @Mock
    private PDP pdp;

    @Mock
    private User user;

    @Mock
    private Request request;

    @Mock
    private com.mobi.security.policy.api.Response response;

    @Override
    protected Application configureApp() {
        MockitoAnnotations.initMocks(this);
        vf = getValueFactory();

        rest = new PolicyEnforcementRestImpl();
        rest.setEngineManager(engineManager);
        rest.setPdp(pdp);
        rest.setVf(vf);

        return new ResourceConfig().register(rest);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setUpMocks() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(user.getResource()).thenReturn(vf.createIRI(USER_IRI));
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.evaluate(any())).thenReturn(response);
        when(request.toString()).thenReturn("");
        when(response.toString()).thenReturn("");
        when(response.getDecision()).thenReturn(Decision.PERMIT);

        String attrs = "{\"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\":"
                + "\"http://mobi.com/ontologies/ontology-editor#OntologyRecord\"}";
        json = new JSONObject();
        json.put("subjectAttrs", attrs);
        json.put("resourceId", "urn:resourceId");
        json.put("resourceAttrs", attrs);
        json.put("actionId", "urn:actionId");
        json.put("actionAttrs", attrs);
    }

    @Test
    public void evaluateRequestTest() {
        Response response = target().path("pep").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void evaluateEmptyRequestTest() {
        Response response = target().path("pep").request().post(Entity.json(new JSONObject()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void evaluateEmptyActionIdTest() {
        json.remove("actionId");
        Response response = target().path("pep").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void evaluateEmptyResourceIdTest() {
        json.remove("resourceId");
        Response response = target().path("pep").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void evaluateEmptySubjectAttrsTest() {
        json.remove("subjectAttrs");
        Response response = target().path("pep").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void evaluateEmptyActionAttrsTest() {
        json.remove("actionAttrs");
        Response response = target().path("pep").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void evaluateEmptyResourceAttrsTest() {
        json.remove("resourceAttrs");
        Response response = target().path("pep").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void evaluateRequestNoUserTest() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        when(user.getResource()).thenReturn(vf.createIRI(AuthenticationProps.ANON_USER));
        Response response = target().path("pep").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void evaluateRequestDenyDecisionTest() {
        when(response.getDecision()).thenReturn(Decision.DENY);
        Response response = target().path("pep").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void evaluateRequestIndeterminateDecisionTest() {
        when(response.getDecision()).thenReturn(Decision.INDETERMINATE);
        Response response = target().path("pep").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void evaluateRequestNADecisionTest() {
        when(response.getDecision()).thenReturn(Decision.NOT_APPLICABLE);
        Response response = target().path("pep").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 200);
    }
}
