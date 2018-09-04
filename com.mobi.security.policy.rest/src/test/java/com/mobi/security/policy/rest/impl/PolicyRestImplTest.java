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
import static com.mobi.persistence.utils.ResourceUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertNotNull;
import static org.testng.Assert.fail;

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import com.mobi.security.policy.api.exception.PolicySyntaxException;
import com.mobi.security.policy.api.xacml.PolicyQueryParams;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.Collections;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Response;

public class PolicyRestImplTest extends MobiRestTestNg {
    private PolicyRestImpl rest;
    private ValueFactory vf;

    private String xml;
    private String json;
    private XACMLPolicy policy;
    private IRI policyId;

    @Mock
    private XACMLPolicyManager policyManager;

    @Override
    protected Application configureApp() throws Exception {
        MockitoAnnotations.initMocks(this);
        vf = getValueFactory();

        xml = IOUtils.toString(getClass().getResourceAsStream("/policy.xml"));
        json = IOUtils.toString(getClass().getResourceAsStream("/policy.json"));
        policy = new XACMLPolicy(xml, vf);
        policyId = vf.createIRI("http://mobi.com/policies/policy1");

        rest = new PolicyRestImpl();
        rest.setVf(vf);
        rest.setPolicyManager(policyManager);

        return new ResourceConfig()
                .register(rest)
                .register(UsernameTestFilter.class)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setUpMocks() throws Exception {
        reset(policyManager);

        when(policyManager.getPolicies(any(PolicyQueryParams.class))).thenReturn(Collections.singletonList(policy));
        when(policyManager.createPolicy(any(PolicyType.class))).thenReturn(policy);
        when(policyManager.addPolicy(policy)).thenReturn(policyId);
        when(policyManager.getPolicy(any(Resource.class))).thenReturn(Optional.empty());
        when(policyManager.getPolicy(policyId)).thenReturn(Optional.of(policy));
    }

    // GET policies

    /*@Test
    public void test() throws Exception {
        PolicyType original = JAXB.unmarshal(new StringReader(xml), PolicyType.class);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JaxbAnnotationModule());
        StringWriter writer = new StringWriter();
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(writer, original);
        System.out.println(writer.toString());
    }*/

    @Test
    public void getPoliciesTest() {
        Response response = target().path("policies").request().get();
        assertEquals(response.getStatus(), 200);
        verify(policyManager).getPolicies(any(PolicyQueryParams.class));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject policyObj = result.optJSONObject(0);
            assertNotNull(policyObj);
            String id = policyObj.optString("PolicyId");
            assertNotNull(id);
            assertEquals(id, policyId.stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getPoliciesErrorTest() {
        // Setup:
        doThrow(new IllegalStateException()).when(policyManager).getPolicies(any(PolicyQueryParams.class));

        Response response = target().path("policies").request().get();
        assertEquals(response.getStatus(), 500);
        verify(policyManager).getPolicies(any(PolicyQueryParams.class));
    }

    // POST policies

    @Test
    public void createPolicyTest() {
        Response response = target().path("policies").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 201);
        assertEquals(response.readEntity(String.class), policyId.stringValue());
        verify(policyManager).createPolicy(any(PolicyType.class));
        verify(policyManager).addPolicy(policy);
    }

    @Test
    public void createPolicyMissingIdTest() {
        Response response = target().path("policies").request().post(Entity.json("{}"));
        assertEquals(response.getStatus(), 400);
        verify(policyManager, times(0)).createPolicy(any(PolicyType.class));
        verify(policyManager, times(0)).addPolicy(any(XACMLPolicy.class));
    }

    @Test
    public void createPolicyThatAlreadyExistsTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(policyManager).addPolicy(policy);

        Response response = target().path("policies").request().post(Entity.json("{\"PolicyId\": \"urn:test\"}"));
        assertEquals(response.getStatus(), 400);
        verify(policyManager).createPolicy(any(PolicyType.class));
        verify(policyManager).addPolicy(any(XACMLPolicy.class));
    }

    @Test
    public void createPolicyBadXMLTest() {
        // Setup:
        doThrow(new PolicySyntaxException()).when(policyManager).createPolicy(any(PolicyType.class));

        Response response = target().path("policies").request().post(Entity.json("{\"PolicyId\": \"urn:test\"}"));
        assertEquals(response.getStatus(), 400);
        verify(policyManager).createPolicy(any(PolicyType.class));
        verify(policyManager, times(0)).addPolicy(any(XACMLPolicy.class));
    }

    @Test
    public void createPolicyErrorTest() {
        // Setup
        doThrow(new IllegalStateException()).when(policyManager).addPolicy(policy);

        Response response = target().path("policies").request().post(Entity.json(json));
        assertEquals(response.getStatus(), 500);
        verify(policyManager).createPolicy(any(PolicyType.class));
        verify(policyManager).addPolicy(policy);
    }

    // GET policies/{policyId}

    @Test
    public void retrievePolicyTest() {
        Response response = target().path("policies/" + encode(policyId.stringValue())).request().get();
        assertEquals(response.getStatus(), 200);
        verify(policyManager).getPolicy(policyId);
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            String id = result.optString("PolicyId");
            assertNotNull(id);
            assertEquals(id, policyId.stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void retrievePolicyThatDoesNotExistTest() {
        Response response = target().path("policies/" + encode("urn:missing")).request().get();
        assertEquals(response.getStatus(), 400);
        verify(policyManager).getPolicy(vf.createIRI("urn:missing"));
    }

    @Test
    public void retrievePolicyErrorTest() {
        // Setup:
        doThrow(new IllegalStateException()).when(policyManager).getPolicy(policyId);

        Response response = target().path("policies/" + encode(policyId.stringValue())).request().get();
        assertEquals(response.getStatus(), 500);
        verify(policyManager).getPolicy(policyId);
    }

    // PUT policies/{policyId}

    @Test
    public void updatePolicyTest() {
        Response response = target().path("policies/" + encode(policyId.stringValue())).request().put(Entity.json(json));
        assertEquals(response.getStatus(), 200);
        verify(policyManager).createPolicy(any(PolicyType.class));
        verify(policyManager).updatePolicy(policy);
    }

    @Test
    public void updatePolicyMissingIdTest() {
        Response response = target().path("policies/" + encode(policyId.stringValue())).request().put(Entity.json("{}"));
        assertEquals(response.getStatus(), 400);
        verify(policyManager, times(0)).createPolicy(any(PolicyType.class));
        verify(policyManager, times(0)).updatePolicy(any(XACMLPolicy.class));
    }

    @Test
    public void updatePolicyBadXMLTest() {
        // Setup:
        doThrow(new PolicySyntaxException()).when(policyManager).createPolicy(any(PolicyType.class));

        Response response = target().path("policies/" + encode(policyId.stringValue())).request().put(Entity.json("{\"PolicyId\": \"urn:test\"}"));
        assertEquals(response.getStatus(), 400);
        verify(policyManager).createPolicy(any(PolicyType.class));
        verify(policyManager, times(0)).updatePolicy(any(XACMLPolicy.class));
    }

    @Test
    public void updatePolicyIdDoesNotMatchTest() {
        Response response = target().path("policies/" + encode("urn:different")).request().put(Entity.json(json));
        assertEquals(response.getStatus(), 400);
        verify(policyManager).createPolicy(any(PolicyType.class));
        verify(policyManager, times(0)).updatePolicy(any(XACMLPolicy.class));
    }

    @Test
    public void updatePolicyErrorTest() {
        // Setup:
        doThrow(new IllegalStateException()).when(policyManager).updatePolicy(policy);

        Response response = target().path("policies/" + encode(policyId.stringValue())).request().put(Entity.json(json));
        assertEquals(response.getStatus(), 500);
        verify(policyManager).createPolicy(any(PolicyType.class));
        verify(policyManager).updatePolicy(any(XACMLPolicy.class));
    }
}
