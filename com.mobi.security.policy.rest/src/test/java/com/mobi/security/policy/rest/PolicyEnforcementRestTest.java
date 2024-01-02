package com.mobi.security.policy.rest;

/*-
 * #%L
 * com.mobi.security.policy.rest
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.ValueFactory;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.web.security.util.AuthenticationProps;
import net.sf.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Response;

public class PolicyEnforcementRestTest extends MobiRestTestCXF {
    private static final String USER_IRI = "http://mobi.com/users/tester";
    private static final ObjectMapper mapper = new ObjectMapper();

    private JSONObject json;
    private AutoCloseable closeable;
    private JSONObject multiRequestJson;
    private String multiResponse;

    // Mock services used in server
    private static PolicyEnforcementRest rest;
    private static ValueFactory vf;
    private static EngineManager engineManager;
    private static PDP pdp;

    @Mock
    private User user;

    @Mock
    private Request request;

    @Mock
    private com.mobi.security.policy.api.Response response;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();

        pdp = Mockito.mock(PDP.class);
        engineManager = Mockito.mock(EngineManager.class);

        rest = new PolicyEnforcementRest();
        rest.setEngineManager(engineManager);
        rest.setPdp(pdp);

        configureServer(rest);
    }

    @Before
    public void setUpMocks() throws IOException {
        closeable = MockitoAnnotations.openMocks(this);
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(user.getResource()).thenReturn(vf.createIRI(USER_IRI));
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.evaluate(any(), any(IRI.class))).thenReturn(response);
        multiResponse = "[\n" +
                "                    {\n" +
                "                      \"urn:oasis:names:tc:xacml:3.0:attribute-category:resource\": \"record3\",\n" +
                "                      \"urn:oasis:names:tc:xacml:1.0:subject-category:access-subject\": " +
                "\"urn:testUser\",\n" +
                "                      \"urn:oasis:names:tc:xacml:3.0:attribute-category:action\": \"http://mobi" +
                ".com/ontologies/policy#Delete\",\n" +
                "                      \"decision\": \"Deny\"" +
                "                    }\n" +
                "                  ]";
        when(pdp.evaluateMultiResponse(any(), any(IRI.class))).thenReturn((ArrayNode) mapper.readTree(multiResponse));
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

        multiRequestJson = new JSONObject();
        multiRequestJson.put("subjectAttrs", attrs);
        multiRequestJson.put("resourceId", Arrays.asList("urn:resourceId"));
        multiRequestJson.put("resourceAttrs", attrs);
        multiRequestJson.put("actionId", Arrays.asList("urn:actionId"));
        multiRequestJson.put("actionAttrs", attrs);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void evaluateRequestTest() {
        Response response = target().path("pep").request().post(Entity.json(json.toString()));
        assertEquals(response.readEntity(String.class), Decision.PERMIT.toString());
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void evaluateEmptyRequestTest() {
        Response response = target().path("pep").request().post(Entity.json(new JSONObject().toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void evaluateEmptyActionIdTest() {
        json.remove("actionId");
        Response response = target().path("pep").request().post(Entity.json(json.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void evaluateEmptyResourceIdTest() {
        json.remove("resourceId");
        Response response = target().path("pep").request().post(Entity.json(json.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void evaluateEmptySubjectAttrsTest() {
        json.remove("subjectAttrs");
        Response response = target().path("pep").request().post(Entity.json(json.toString()));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), Decision.PERMIT.toString());
    }

    @Test
    public void evaluateEmptyActionAttrsTest() {
        json.remove("actionAttrs");
        Response response = target().path("pep").request().post(Entity.json(json.toString()));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), Decision.PERMIT.toString());
    }

    @Test
    public void evaluateEmptyResourceAttrsTest() {
        json.remove("resourceAttrs");
        Response response = target().path("pep").request().post(Entity.json(json.toString()));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), Decision.PERMIT.toString());
    }

    @Test
    public void evaluateRequestNoUserTest() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        when(user.getResource()).thenReturn(vf.createIRI(AuthenticationProps.ANON_USER));
        Response response = target().path("pep").request().post(Entity.json(json.toString()));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), Decision.PERMIT.toString());
    }

    @Test
    public void evaluateRequestDenyDecisionTest() {
        when(response.getDecision()).thenReturn(Decision.DENY);
        Response response = target().path("pep").request().post(Entity.json(json.toString()));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), Decision.DENY.toString());
    }

    @Test
    public void evaluateRequestIndeterminateDecisionTest() {
        when(response.getDecision()).thenReturn(Decision.INDETERMINATE);
        Response response = target().path("pep").request().post(Entity.json(json.toString()));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), Decision.INDETERMINATE.toString());
    }

    @Test
    public void evaluateRequestNADecisionTest() {
        when(response.getDecision()).thenReturn(Decision.NOT_APPLICABLE);
        Response response = target().path("pep").request().post(Entity.json(json.toString()));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), Decision.NOT_APPLICABLE.toString());
    }

    @Test
    public void evaluateMultiRequestTest() throws IOException {
        Response response = target().path("pep/multiDecisionRequest").request().post(Entity.json(multiRequestJson.toString()));
        assertEquals(response.readEntity(String.class), ((ArrayNode) mapper.readTree(multiResponse)).toString());
        assertEquals(response.getStatus(), 200);
    }
}
