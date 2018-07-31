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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.xacml.XACMLRequest;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.Map;
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
    EngineManager engineManager;

    @Mock
    PDP pdp;

    @Mock
    private User user;

    @Mock
    private Request request;

    @Mock
    private com.mobi.security.policy.api.Response response;

    @Mock
    private Decision decision;

    @Override
    protected Application configureApp() throws Exception {
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

    @Before
    public void setUpMocks() throws Exception {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(user.getResource()).thenReturn(vf.createIRI(USER_IRI));
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.evaluate(any())).thenReturn(response);
        when(request.toString()).thenReturn("");
        when(response.toString()).thenReturn("");
        when(response.getDecision()).thenReturn(decision);
        when(decision.toString()).thenReturn("");

        Map<String, Literal> subjectAttrs = new HashMap<>();
        IRI resourceId = vf.createIRI("urn:resourceId");
        Map<String, Literal> resourceAttrs = new HashMap<>();
        IRI actionId = vf.createIRI("urn:actionId");
        Map<String, Literal> actionAttrs = new HashMap<>();

        json = new JSONObject();
        json.put("subjectAttrs", subjectAttrs);
        json.put("resourceId", resourceId);
        json.put("resourceAttrs", resourceAttrs);
        json.put("actionId", actionId);
        json.put("actionAttrs", actionAttrs);
    }

    @Test
    public void evaluateRequestTest() throws Exception {
        Response response = target().path("policy-enforcement").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 200);
    }
}
