package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * security.policy.impl
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.when;

import com.mobi.ontologies.rdfs.Resource;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.security.policy.api.AttributeDesignator;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PIP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.Response;
import com.mobi.security.policy.api.Status;
import com.mobi.security.policy.api.ontologies.policy.PolicyFile;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystem;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.lang.reflect.Method;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class BalanaPDPTest extends OrmEnabledTestCase {
    private Repository repo;
    private BalanaPDP pdp;
    private BalanaPRP prp;

    private OrmFactory<PolicyFile> policyFileFactory = getRequiredOrmFactory(PolicyFile.class);

    private IRI policy1 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy1");
    private IRI policy2 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy2");
    private IRI policy3 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy3");
    private IRI policy4 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy4");
    private IRI userX = VALUE_FACTORY.createIRI("http://mobi.com/users/UserX");
    private IRI resource = VALUE_FACTORY.createIRI("http://mobi.com/catalog-local");
    private IRI createAction = VALUE_FACTORY.createIRI("http://mobi.com/ontologies/policy#Create");
    private Literal actionType = VALUE_FACTORY.createLiteral("http://mobi.com/ontologies/ontology-editor#OntologyRecord");

    @Mock
    private PIP pip;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        MockitoAnnotations.initMocks(this);
        when(pip.findAttribute(any(AttributeDesignator.class), any(Request.class))).thenReturn(Collections.emptyList());

        SimpleVirtualFilesystem vfs = new SimpleVirtualFilesystem();
        Map<String, Object> config = new HashMap<>();
        config.put("maxNumberOfTempFiles", 10000);
        config.put("secondsBetweenTempCleanup", 60000);

        Method m = vfs.getClass().getDeclaredMethod("activate", Map.class);
        m.setAccessible(true);
        m.invoke(vfs, config);

        prp = new BalanaPRP();
        injectOrmFactoryReferencesIntoService(prp);
        prp.setRepo(repo);
        prp.setMf(MODEL_FACTORY);
        prp.setVf(VALUE_FACTORY);
        prp.setVfs(vfs);
        pdp = new BalanaPDP();
        pdp.addPIP(pip);
        pdp.setBalanaPRP(prp);
        pdp.setVf(VALUE_FACTORY);
        pdp.setUp();
    }

    @Test
    public void simplePermitTest() throws Exception {
        // Setup:
        loadPolicy(policy1);
        XACMLRequest request = new XACMLRequest.Builder(userX, resource, createAction, OffsetDateTime.now()).build();

        Response result = pdp.evaluate(request);
        System.out.println(result);
        assertEquals(Decision.PERMIT, result.getDecision());
        assertEquals(Status.OK, result.getStatus());
        assertTrue(result.getPolicyIds().contains(policy1));
    }

    @Test
    public void missingAttributeTest() throws Exception {
        // Setup:
        loadPolicy(policy2);
        XACMLRequest request = new XACMLRequest.Builder(userX, resource, createAction, OffsetDateTime.now())
                .addActionAttr(Resource.type_IRI, actionType)
                .build();

        Response result = pdp.evaluate(request);
        System.out.println(result);
        assertEquals(Decision.DENY, result.getDecision());
        assertEquals(Status.OK, result.getStatus());
        assertTrue(result.getPolicyIds().contains(policy2));
    }

    @Test
    public void syntaxErrorTest() throws Exception {
        // Setup:
        loadPolicy(policy3);
        XACMLRequest.Builder builder = new XACMLRequest.Builder(userX, resource, createAction, OffsetDateTime.now());
        builder.addActionAttr(Resource.type_IRI, actionType);

        Response result = pdp.evaluate(builder.build());
        System.out.println(result);
        assertEquals(Decision.INDETERMINATE, result.getDecision());
        assertEquals(Status.SYNTAX_ERROR, result.getStatus());
        assertTrue(result.getPolicyIds().isEmpty());
    }

    @Test
    public void unsupportedCategoryInRuleTest() throws Exception {
        // Setup:
        loadPolicy(policy4);
        XACMLRequest.Builder builder = new XACMLRequest.Builder(userX, resource, createAction, OffsetDateTime.now());
        builder.addActionAttr(Resource.type_IRI, actionType);

        Response result = pdp.evaluate(builder.build());
        System.out.println(result);
        assertEquals(Decision.DENY, result.getDecision());
        assertEquals(Status.OK, result.getStatus());
        assertTrue(result.getPolicyIds().contains(policy4));
    }

    private void loadPolicy(IRI policyId) {
        PolicyFile policyFile = policyFileFactory.createNew(VALUE_FACTORY.createIRI(getClass().getResource("/" + policyId.getLocalName() + ".xml").toString()));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(policyFile.getModel(), policyFile.getResource());
        }
    }
}
