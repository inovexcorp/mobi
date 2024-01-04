package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * security.policy.impl
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.exception.MobiException;
import com.mobi.ontologies.rdfs.Resource;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.AttributeDesignator;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PIP;
import com.mobi.security.policy.api.Policy;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.Response;
import com.mobi.security.policy.api.Status;
import com.mobi.security.policy.api.cache.PolicyCache;
import com.mobi.security.policy.api.xacml.XACML;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.w3c.dom.Document;
import org.wso2.balana.AbstractPolicy;

import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import javax.cache.Cache;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.parsers.DocumentBuilderFactory;

public class BalanaPDPTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private BalanaPDP pdp;
    private BalanaPRP prp;

    private IRI policy1 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy1");
    private IRI policy2 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy2");
    private IRI policy3 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy3");
    private IRI policy4 = VALUE_FACTORY.createIRI("http://mobi.com/policies/policy4");
    private IRI userX = VALUE_FACTORY.createIRI("http://mobi.com/users/UserX");
    private IRI resource = VALUE_FACTORY.createIRI("http://mobi.com/catalog-local");
    private IRI distributedCatalog = VALUE_FACTORY.createIRI("http://mobi.com/catalog-distributed");
    private IRI createAction = VALUE_FACTORY.createIRI("http://mobi.com/ontologies/policy#Create");
    private Literal actionType = VALUE_FACTORY.createLiteral("http://mobi.com/ontologies/ontology-editor#OntologyRecord");
    private JAXBContext jaxbContext;

    @Mock
    private PIP pip;

    @Mock
    private PolicyCache policyCache;

    @Mock
    private XACMLPolicyManager policyManager;

    @Mock
    private Cache<String, Policy> cache;

    private List<Cache.Entry<String, Policy>> entries;

    @Before
    public void setUp() throws Exception {
        System.setProperty("com.sun.xml.bind.v2.bytecode.ClassTailor.noOptimize", "true"); // JDK16+ fix
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        try {
            jaxbContext = JAXBContext.newInstance("com.mobi.security.policy.api.xacml.jaxb");
        } catch (JAXBException e) {
            throw new MobiException(e);
        }
        closeable = MockitoAnnotations.openMocks(this);
        when(pip.findAttribute(any(AttributeDesignator.class), any(Request.class))).thenReturn(Collections.emptyList());
        when(policyManager.getRepository()).thenReturn(repo);

        entries = new ArrayList<>();
        when(policyCache.getPolicyCache()).thenReturn(Optional.of(cache));
        when(cache.spliterator()).thenReturn(entries.spliterator());
        prp = new BalanaPRP();
        prp.setPolicyCache(policyCache);
        prp.setPolicyManager(policyManager);
        pdp = new BalanaPDP();
        pdp.addPIP(pip);
        pdp.balanaPRP = prp;
        pdp.setUp();
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void simplePermitTest() throws Exception {
        // Setup:
        loadPolicy(policy1);
        BalanaRequest request = new BalanaRequest.Builder(Arrays.asList(userX), Arrays.asList(resource),
                Arrays.asList(createAction), OffsetDateTime.now(), VALUE_FACTORY, jaxbContext).build();

        Response result = pdp.evaluate(request);
        assertEquals(Decision.PERMIT, result.getDecision());
        assertEquals(Status.OK, result.getStatus());
        assertTrue(result.getPolicyIds().contains(policy1));
        verify(policyManager).getSystemPolicyIds();
    }

    @Test
    public void simpleFilterOnePermit() throws Exception {
        // Setup:
        loadPolicy(policy4);
        BalanaRequest request = new BalanaRequest.Builder(Arrays.asList(userX),
                Arrays.asList(resource), Arrays.asList(createAction), OffsetDateTime.now(), VALUE_FACTORY,
                jaxbContext).build();

        Set<String> result = pdp.filter(request, getValueFactory().createIRI(XACML.POLICY_PERMIT_OVERRIDES));
        assertEquals(1, result.size());
        assertTrue(result.contains(resource.stringValue()));
    }

    @Test
    public void simpleFilterOneDeny() throws Exception {
        // Setup:
        loadPolicy(policy4);
        BalanaRequest request = new BalanaRequest.Builder(Arrays.asList(userX),
                Arrays.asList(distributedCatalog), Arrays.asList(createAction), OffsetDateTime.now(), VALUE_FACTORY,
                jaxbContext).build();

        Set<String> result = pdp.filter(request, getValueFactory().createIRI(XACML.POLICY_PERMIT_OVERRIDES));
        assertEquals(0, result.size());
    }

    @Test
    public void simpleFilterOneNotApplicable() throws Exception {
        // Setup:
        loadPolicy(policy1);
        BalanaRequest request = new BalanaRequest.Builder(Arrays.asList(userX),
                Arrays.asList(VALUE_FACTORY.createIRI("http://mobi.com/madeup-catalog")),
                Arrays.asList(createAction), OffsetDateTime.now(), VALUE_FACTORY,
                jaxbContext).build();

        Set<String> result = pdp.filter(request, getValueFactory().createIRI(XACML.POLICY_PERMIT_OVERRIDES));
        assertEquals(1, result.size());
        assertTrue(result.contains("http://mobi.com/madeup-catalog"));
    }

    @Test
    public void missingAttributeTest() throws Exception {
        // Setup:
        loadPolicy(policy2);
        BalanaRequest.Builder builder = new BalanaRequest.Builder(Arrays.asList(userX), Arrays.asList(resource), Arrays.asList(createAction), OffsetDateTime.now(), VALUE_FACTORY, jaxbContext);
        builder.addActionAttr(Resource.type_IRI, actionType);

        Response result = pdp.evaluate(builder.build());
        assertEquals(Decision.DENY, result.getDecision());
        assertEquals(Status.OK, result.getStatus());
        assertTrue(result.getPolicyIds().contains(policy2));
        verify(policyManager).getSystemPolicyIds();
    }

    @Test
    public void unsupportedCategoryInRuleTest() throws Exception {
        // Setup:
        loadPolicy(policy3);
        BalanaRequest.Builder builder = new BalanaRequest.Builder(Arrays.asList(userX), Arrays.asList(resource), Arrays.asList(createAction), OffsetDateTime.now(), VALUE_FACTORY, jaxbContext);
        builder.addActionAttr(Resource.type_IRI, actionType);

        Response result = pdp.evaluate(builder.build());
        assertEquals(Decision.DENY, result.getDecision());
        assertEquals(Status.OK, result.getStatus());
        assertTrue(result.getPolicyIds().contains(policy3));
        verify(policyManager).getSystemPolicyIds();
    }

    @Test
    public void noPolicyTest() throws Exception {
        // Setup:
        BalanaRequest request = new BalanaRequest.Builder(Arrays.asList(userX), Arrays.asList(resource), Arrays.asList(createAction), OffsetDateTime.now(), VALUE_FACTORY, jaxbContext).build();

        Response result = pdp.evaluate(request);
        assertEquals(Status.OK, result.getStatus());
        assertEquals(Decision.NOT_APPLICABLE, result.getDecision());
        assertTrue(result.getPolicyIds().isEmpty());
        verify(policyManager).getSystemPolicyIds();
    }

    private void loadPolicy(IRI policyId) throws Exception {
        try (InputStream in = getClass().getResourceAsStream("/" + policyId.getLocalName() + ".xml")) {
            DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
            docFactory.setNamespaceAware(true);
            Document doc = docFactory.newDocumentBuilder().parse(in);
            AbstractPolicy abstractPolicy = org.wso2.balana.Policy.getInstance(doc.getDocumentElement());
            Policy policy = new BalanaPolicy(abstractPolicy, VALUE_FACTORY);
            Cache.Entry<String, Policy> entry = mock(Cache.Entry.class);
            when(entry.getKey()).thenReturn(policyId.stringValue());
            when(entry.getValue()).thenReturn(policy);
            entries.add(entry);
        }
    }
}
