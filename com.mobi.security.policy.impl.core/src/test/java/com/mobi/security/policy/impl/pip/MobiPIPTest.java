package com.mobi.security.policy.impl.pip;

/*-
 * #%L
 * com.mobi.security.policy.pip.impl
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
import static org.mockito.Mockito.when;

import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.AttributeDesignator;
import com.mobi.security.policy.api.Request;
import com.mobi.vocabularies.xsd.XSD;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MobiPIPTest extends OrmEnabledTestCase {
    private MobiPIP pip;
    private Repository repo;

    private IRI subjectCategory = VALUE_FACTORY.createIRI("http://test.com/category-subject");
    private IRI resourceCategory = VALUE_FACTORY.createIRI("http://test.com/category-resource");
    private IRI actionCategory = VALUE_FACTORY.createIRI("http://test.com/category-action");
    private IRI parentId = VALUE_FACTORY.createIRI("http://test.com/parent");
    private IRI subjectId = VALUE_FACTORY.createIRI("http://test.com/subject");
    private IRI resourceId = VALUE_FACTORY.createIRI("http://test.com/resource");
    private IRI actionId = VALUE_FACTORY.createIRI("http://test.com/action");
    private IRI prop1Id = VALUE_FACTORY.createIRI("http://test.com/prop1");
    private IRI prop2Id = VALUE_FACTORY.createIRI("http://test.com/prop2");
    private IRI pathPropId = VALUE_FACTORY.createIRI("http://test.com/path");
    private IRI datatypeId = VALUE_FACTORY.createIRI("http://test.com/prop");
    private IRI titleIRI = VALUE_FACTORY.createIRI(_Thing.title_IRI);
    private IRI pathId;
    private Map<String, Literal> attrs = createAttrs();

    private OffsetDateTime time = OffsetDateTime.now();

    @Mock
    private AttributeDesignator designator;

    @Mock
    private Request request;

    @Before
    public void setup() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        pathId = VALUE_FACTORY.createIRI(MobiPIP.PROP_PATH_NAMESPACE + "("
                + RestUtils.encode("^<" + pathPropId.stringValue() + ">/<" + titleIRI.stringValue()) + ">)");

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(subjectId, prop1Id, VALUE_FACTORY.createLiteral(true));
            conn.add(resourceId, prop1Id, VALUE_FACTORY.createLiteral(1));
            conn.add(resourceId, prop1Id, VALUE_FACTORY.createLiteral(2));
            conn.add(parentId, pathPropId, subjectId);
            conn.add(parentId, pathPropId, resourceId);
            conn.add(parentId, titleIRI, VALUE_FACTORY.createLiteral("Title"));
        }

        MockitoAnnotations.initMocks(this);
        when(designator.attributeId()).thenReturn(prop1Id);
        when(designator.category()).thenReturn(subjectCategory);
        when(designator.datatype()).thenReturn(datatypeId);

        when(request.getSubjectCategory()).thenReturn(subjectCategory);
        when(request.getResourceCategory()).thenReturn(resourceCategory);
        when(request.getActionCategory()).thenReturn(actionCategory);
        when(request.getSubjectId()).thenReturn(subjectId);
        when(request.getSubjectAttrs()).thenReturn(attrs);
        when(request.getResourceId()).thenReturn(resourceId);
        when(request.getResourceAttrs()).thenReturn(attrs);
        when(request.getActionId()).thenReturn(actionId);
        when(request.getActionAttrs()).thenReturn(attrs);
        when(request.getRequestTime()).thenReturn(time);

        pip = new MobiPIP();
        pip.setRepo(repo);
        pip.setVf(VALUE_FACTORY);
    }

    @Test
    public void findAttributeWithUnsupportedCategoryTest() {
        // Setup:
        when(designator.category()).thenReturn(actionId);

        List<Literal> result = pip.findAttribute(designator, request);
        assertEquals(0, result.size());
    }

    // Subject

    @Test
    public void findAttributeSubjectDirectTest() throws Exception {
        List<Literal> result = pip.findAttribute(designator, request);
        assertEquals(1, result.size());
        Literal value = result.get(0);
        assertEquals(VALUE_FACTORY.createIRI(XSD.BOOLEAN), value.getDatatype());
        assertEquals(true, value.booleanValue());
    }

    @Test
    public void findAttributeSubjectPathTest() throws Exception {
        // Setup:
        when(designator.attributeId()).thenReturn(pathId);

        List<Literal> result = pip.findAttribute(designator, request);
        assertEquals(1, result.size());
        assertEquals("Title", result.get(0).stringValue());
    }

    @Test
    public void findAttributeSubjectMissingPropTest() throws Exception {
        // Setup:
        when(designator.attributeId()).thenReturn(titleIRI);

        List<Literal> result = pip.findAttribute(designator, request);
        assertEquals(0, result.size());
    }

    // Resource

    @Test
    public void findAttributeResourceDirectTest() throws Exception {
        // Setup:
        when(designator.category()).thenReturn(resourceCategory);

        List<Literal> result = pip.findAttribute(designator, request);
        assertEquals(2, result.size());
        result.forEach(literal -> {
            assertEquals(VALUE_FACTORY.createIRI(XSD.INT), literal.getDatatype());
            assertTrue(Arrays.asList(1, 2).contains(literal.intValue()));
        });
    }

    @Test
    public void findAttributeResourcePathTest() throws Exception {
        // Setup:
        when(designator.category()).thenReturn(resourceCategory);
        when(designator.attributeId()).thenReturn(pathId);

        List<Literal> result = pip.findAttribute(designator, request);
        assertEquals(1, result.size());
        assertEquals("Title", result.get(0).stringValue());
    }

    @Test
    public void findAttributeResourceMissingPropTest() throws Exception {
        // Setup:
        when(designator.attributeId()).thenReturn(titleIRI);

        List<Literal> result = pip.findAttribute(designator, request);
        assertEquals(0, result.size());
    }

    private Map<String, Literal> createAttrs() {
        Map<String, Literal> map = new HashMap<>();
        map.put(prop2Id.stringValue(), VALUE_FACTORY.createLiteral("Test"));
        return map;
    }
}
