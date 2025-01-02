package com.mobi.security.policy.rest;

/*-
 * #%L
 * com.mobi.security.policy.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import com.mobi.security.policy.api.ontologies.policy.PolicyFile;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Objects;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Response;

public class RecordPermissionsRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private static final ObjectMapper mapper = new ObjectMapper();
    private String recordJson;
    private XACMLPolicy recordPolicy;
    private XACMLPolicy policyPolicy;
    private IRI recordIRI;
    private IRI recordPolicyIRI;
    private IRI policyPolicyIRI;
    private IRI invalidIRI;
    private final OrmFactory<PolicyFile> policyFileFactory = getRequiredOrmFactory(PolicyFile.class);

    // Mock services used in server
    private static RecordPermissionsRest rest;
    private static ValueFactory vf;
    private static XACMLPolicyManager policyManager;
    private static MemoryRepositoryWrapper repo;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();

        policyManager = Mockito.mock(XACMLPolicyManager.class);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        rest = new RecordPermissionsRest();
        rest.policyManager = policyManager;

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setUpMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        vf = getValueFactory();

        recordJson = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/recordPolicy.json")),
                StandardCharsets.UTF_8);
        recordIRI = vf.createIRI("http://mobi.com/records/testRecord1");
        recordPolicyIRI = vf.createIRI("http://mobi.com/policies/record/https%3A%2F%2Fmobi.com%2Frecords%2FtestRecord1");
        policyPolicyIRI = vf.createIRI("http://mobi.com/policies/policy/record/https%3A%2F%2Fmobi.com%2Frecords%2FtestRecord1");
        invalidIRI = vf.createIRI("urn:invalidRecordId");

        recordPolicy = new XACMLPolicy(IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/recordPolicy.xml")),
                StandardCharsets.UTF_8), vf);
        policyPolicy = new XACMLPolicy(IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/policyPolicy.xml")),
                StandardCharsets.UTF_8), vf);

        try (RepositoryConnection conn = repo.getConnection()) {
            PolicyFile policyFile = policyFileFactory.createNew(recordPolicyIRI);
            policyFile.setRelatedResource(Collections.singleton(recordIRI));
            conn.add(policyFile.getModel());

            PolicyFile policyPolicyFile = policyFileFactory.createNew(policyPolicyIRI);
            policyPolicyFile.setRelatedResource(Collections.singleton(
                    vf.createIRI("http://mobi.com/policies/record/https%3A%2F%2Fmobi.com%2Frecords%2FtestRecord1")));
            conn.add(policyPolicyFile.getModel());
        }

        reset(policyManager);
        when(policyManager.getRepository()).thenReturn(repo);
        when(policyManager.getPolicy(recordPolicyIRI)).thenReturn(Optional.of(recordPolicy));
        when(policyManager.getPolicy(policyPolicyIRI)).thenReturn(Optional.of(policyPolicy));
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        reset(policyManager);
    }

    /* GET /policies/record-permissions/{policyId} */

    @Test
    public void retrieveRecordPolicyTest() {
        Response response = target().path("record-permissions/" + encode(recordIRI.stringValue())).request().get();
        assertEquals(response.getStatus(), 200);
        verify(policyManager).getPolicy(recordPolicyIRI);
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(result, mapper.readValue(recordJson, ObjectNode.class));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void retrieveRecordPolicyDoesNotExistTest() {
        when(policyManager.getPolicy(any(Resource.class))).thenReturn(Optional.empty());
        Response response = target().path("record-permissions/" + encode(invalidIRI.stringValue())).request().get();
        assertEquals(response.getStatus(), 400);
    }

    /* PUT /policies/record-permissions/{policyId} */

    @Test
    public void updateRecordPolicyTest() {
        // Setup
        when(policyManager.createPolicy(any(PolicyType.class))).thenAnswer(invocation -> {
            PolicyType pt = invocation.getArgument(0, PolicyType.class);
            if (pt.getPolicyId().equals(recordPolicyIRI.stringValue())) {
                return recordPolicy;
            } else {
                return policyPolicy;
            }
        });

        Response response = target().path("record-permissions/" + encode(recordIRI.stringValue())).request().put(Entity.json(recordJson));
        assertEquals(response.getStatus(), 200);
        verify(policyManager).getPolicy(recordPolicyIRI);
        verify(policyManager).getPolicy(policyPolicyIRI);
        verify(policyManager, times(2)).createPolicy(any(PolicyType.class));
        verify(policyManager, times(2)).updatePolicy(any(XACMLPolicy.class));
    }

    @Test
    public void updateRecordPolicyDoesNotExistTest() {
        when(policyManager.getPolicy(any(Resource.class))).thenReturn(Optional.empty());
        Response response = target().path("record-permissions/" + encode(invalidIRI.stringValue())).request().put(Entity.json(recordJson));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateRecordPolicyMissingEveryoneTest() throws Exception {
        ObjectNode jsonObject = mapper.readValue(recordJson, ObjectNode.class);
        ((ObjectNode) jsonObject.get("urn:read")).remove("everyone");

        Response response = target().path("record-permissions/" + encode(recordIRI.stringValue())).request().put(Entity.json(jsonObject.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateRecordPolicyMissingUsersTest() throws Exception {
        ObjectNode jsonObject = mapper.readValue(recordJson, ObjectNode.class);
        ((ObjectNode) jsonObject.get("urn:update")).remove("users");

        Response response = target().path("record-permissions/" + encode(recordIRI.stringValue())).request().put(Entity.json(jsonObject.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateRecordPolicyMissingGroupsTest() throws Exception {
        ObjectNode jsonObject = mapper.readValue(recordJson, ObjectNode.class);
        ((ObjectNode) jsonObject.get("urn:update")).remove("groups");

        Response response = target().path("record-permissions/" + encode(recordIRI.stringValue())).request().put(Entity.json(jsonObject.toString()));
        assertEquals(response.getStatus(), 400);
    }
}
