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

import com.mobi.ontologies.rdfs.Resource;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.Response;
import com.mobi.security.policy.api.Status;
import com.mobi.security.policy.api.ontologies.policy.PolicyFile;
import com.mobi.security.policy.pip.impl.MobiPIP;
import org.junit.Before;
import org.junit.Test;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.time.OffsetDateTime;

public class BalanaPDPTest extends OrmEnabledTestCase {
    private Repository repo;
    private BalanaPDP pdp;
    private MobiPIP pip;
    private BalanaPRP prp;

    private OrmFactory<PolicyFile> policyFileFactory = getRequiredOrmFactory(PolicyFile.class);

    private IRI policy1 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy1");
    private IRI policy2 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy2");
    private IRI policy3 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy3");
    private IRI userX = VALUE_FACTORY.createIRI("http://mobi.com/users/UserX");
    private IRI userY = VALUE_FACTORY.createIRI("http://mobi.com/users/UserY");
    private IRI userZ = VALUE_FACTORY.createIRI("http://mobi.com/users/UserZ");
    private IRI resource = VALUE_FACTORY.createIRI("http://mobi.com/catalog-local");
    private IRI createAction = VALUE_FACTORY.createIRI("http://mobi.com/ontologies/policy#Create");
    private Literal actionType = VALUE_FACTORY.createLiteral("http://mobi.com/ontologies/ontology-editor#OntologyRecord");


    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        PolicyFile policyFile = policyFileFactory.createNew(VALUE_FACTORY.createIRI(getClass().getResource("/policy1.xml").toString()));

        InputStream testData = getClass().getResourceAsStream("/testData.ttl");

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(policyFile.getModel(), policyFile.getResource());
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TURTLE)));
        }

        pip = new MobiPIP();
        pip.setRepo(repo);
        pip.setVf(VALUE_FACTORY);
        prp = new BalanaPRP();
        injectOrmFactoryReferencesIntoService(prp);
        prp.setRepo(repo);
        prp.setMf(MODEL_FACTORY);
        prp.setVf(VALUE_FACTORY);
        pdp = new BalanaPDP();
        pdp.setMobiPIP(pip);
        pdp.setBalanaPRP(prp);
        pdp.setVf(VALUE_FACTORY);
        pdp.setUp();
    }

    @Test
    public void simplePermitTest() throws Exception {
        // Setup:
        XACMLRequest.Builder builder = new XACMLRequest.Builder(userX, resource, createAction, OffsetDateTime.now());
        builder.addActionAttr(Resource.type_IRI, actionType);

        Response result = pdp.evaluate(builder.build());
        System.out.println(result);
        assertEquals(Decision.PERMIT, result.getDecision());
        assertEquals(Status.OK, result.getStatus());
        assertTrue(result.getPolicyIds().contains(policy1));
    }

    @Test
    public void propPathPermitTest() throws Exception {
        // Setup:
        XACMLRequest.Builder builder = new XACMLRequest.Builder(userY, resource, createAction, OffsetDateTime.now());
        builder.addActionAttr(Resource.type_IRI, actionType);

        Response result = pdp.evaluate(builder.build());
        System.out.println(result);
        assertEquals(Decision.PERMIT, result.getDecision());
        assertEquals(Status.OK, result.getStatus());
        assertTrue(result.getPolicyIds().contains(policy1));
    }

    @Test
    public void denyTest() throws Exception {
        // Setup:
        XACMLRequest.Builder builder = new XACMLRequest.Builder(userZ, resource, createAction, OffsetDateTime.now());
        builder.addActionAttr(Resource.type_IRI, actionType);

        Response result = pdp.evaluate(builder.build());
        System.out.println(result);
        assertEquals(Decision.DENY, result.getDecision());
        assertEquals(Status.OK, result.getStatus());
        assertTrue(result.getPolicyIds().contains(policy1));
    }

    @Test
    public void syntaxErrorTest() throws Exception {
        // Setup:
        PolicyFile badPolicy = policyFileFactory.createNew(VALUE_FACTORY.createIRI(getClass().getResource("/policy2.xml").toString()));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(badPolicy.getModel(), badPolicy.getResource());
        }
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
        PolicyFile badPolicy = policyFileFactory.createNew(VALUE_FACTORY.createIRI(getClass().getResource("/policy3.xml").toString()));
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(badPolicy.getModel(), badPolicy.getResource());
        }
        XACMLRequest.Builder builder = new XACMLRequest.Builder(userX, resource, createAction, OffsetDateTime.now());
        builder.addActionAttr(Resource.type_IRI, actionType);

        Response result = pdp.evaluate(builder.build());
        System.out.println(result);
        assertEquals(Decision.DENY, result.getDecision());
        assertEquals(Status.OK, result.getStatus());
        assertTrue(result.getPolicyIds().contains(policy1));
        assertTrue(result.getPolicyIds().contains(policy3));
    }
}
