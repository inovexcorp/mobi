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

import static com.mobi.persistence.utils.ResourceUtils.encode;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.fail;

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
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

public class RecordPermissionsRestImplTest extends MobiRestTestNg {
    private RecordPermissionsRestImpl rest;
    private ValueFactory vf;

    private String recordJson;
    private XACMLPolicy recordPolicy;
    private XACMLPolicy policyPolicy;
    private IRI recordPolicyId;
    private IRI policyPolicyId;

    @Mock
    private XACMLPolicyManager policyManager;

    @Override
    protected Application configureApp() throws Exception {
        MockitoAnnotations.initMocks(this);
        vf = getValueFactory();

        recordJson = IOUtils.toString(getClass().getResourceAsStream("/recordPolicy.json"), "UTF-8");
        recordPolicy = new XACMLPolicy(IOUtils.toString(getClass().getResourceAsStream("/recordPolicy.xml"), "UTF-8"), vf);
        policyPolicy = new XACMLPolicy(IOUtils.toString(getClass().getResourceAsStream("/policyPolicy.xml"), "UTF-8"), vf);
        recordPolicyId = vf.createIRI("http://mobi.com/policies/record/https%3A%2F%2Fmobi.com%2Frecords%testRecord1");
        policyPolicyId = vf.createIRI("http://mobi.com/policies/policy/record/https%3A%2F%2Fmobi.com%2Frecords%testRecord1");

        rest = new RecordPermissionsRestImpl();
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
        when(policyManager.getPolicy(recordPolicyId)).thenReturn(Optional.of(recordPolicy));
        when(policyManager.getPolicy(policyPolicyId)).thenReturn(Optional.of(policyPolicy));
    }

    /* GET /policies/record-permissions/{policyId} */

    @Test
    public void retrieveRecordPolicyTest() {
        Response response = target().path("record-permissions/" + encode(recordPolicyId.stringValue())).request().get();
        assertEquals(response.getStatus(), 200);
        verify(policyManager).getPolicy(recordPolicyId);
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(result, JSONObject.fromObject(recordJson));

        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    /* PUT /policies/record-permissions/{policyId} */

    @Test
    public void updateRecordPolicyTest() {
        // Setup
        when(policyManager.createPolicy(any(PolicyType.class))).thenAnswer(invocation -> {
            PolicyType pt = invocation.getArgumentAt(0, PolicyType.class);
            if (pt.getPolicyId().equals(recordPolicyId.stringValue())) {
                return recordPolicy;
            } else {
                return policyPolicy;
            }
        });

        Response response = target().path("record-permissions/" + encode(recordPolicyId.stringValue())).request().put(Entity.json(recordJson));
        assertEquals(response.getStatus(), 200);
        verify(policyManager).getPolicy(recordPolicyId);
        verify(policyManager).getPolicy(policyPolicyId);
        verify(policyManager, times(2)).createPolicy(any(PolicyType.class));
        verify(policyManager, times(2)).updatePolicy(any(XACMLPolicy.class));
    }
}


//class PolicyTypeWithId implements ArgumentMatcher<PolicyType> {
//    String id;
//
//    PolicyTypeWithId(String id) {
//        this.id = id;
//    }
//
//    @Override
//    public boolean matches(PolicyType pt) {
//        return pt.getPolicyId().equals(id);
//    }
//
//}