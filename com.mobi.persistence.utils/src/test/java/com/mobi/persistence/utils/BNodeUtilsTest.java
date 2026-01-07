package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.LinkedHashModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.junit.Before;
import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

public class BNodeUtilsTest {
    private final ValueFactory vf = new ValidatingValueFactory();
    private ModelFactory mf = new LinkedHashModelFactory();

    private Map<BNode, IRI> bNodeIRIMap = new HashMap<>();
    private BNode bnode1;
    private BNode bnode2;
    private BNode bnode3;
    private BNode bnode4;
    private BNode bnode5;
    private IRI detSko1;
    private IRI detSko2;
    private IRI detSko3;
    private IRI testIRI;
    private IRI type;
    private IRI owlClass;
    private IRI title;

    @Before
    public void setup() {

        type = vf.createIRI(RDF.TYPE.stringValue());
        owlClass = vf.createIRI(OWL.CLASS.stringValue());
        title = vf.createIRI(DCTERMS.TITLE.stringValue());

        bnode1 = vf.createBNode();
        bnode2 = vf.createBNode();
        bnode3 = vf.createBNode();
        bnode4 = vf.createBNode();
        bnode5 = vf.createBNode();
        detSko1 = vf.createIRI("urn:detSko1");
        detSko2 = vf.createIRI("urn:detSko2");
        detSko3 = vf.createIRI("urn:detSko3");
        testIRI = vf.createIRI("urn:test");

        bNodeIRIMap.put(bnode1, detSko1);
        bNodeIRIMap.put(bnode2, detSko2);
        bNodeIRIMap.put(bnode3, detSko3);
        bNodeIRIMap.put(bnode4, detSko1);
        bNodeIRIMap.put(bnode5, detSko2);
    }

    @Test
    public void oneToOneSubTest() {
        Model model = mf.createEmptyModel();
        model.add(detSko3, type, owlClass);

        Model expected = mf.createEmptyModel();
        expected.add(bnode3, type, owlClass);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void oneToManySubTest() {
        Model model = mf.createEmptyModel();
        model.add(detSko1, type, owlClass);

        Model expected = mf.createEmptyModel();
        expected.add(bnode1, type, owlClass);
        expected.add(bnode4, type, owlClass);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void manyToManySubTest() {
        Model model = mf.createEmptyModel();
        model.add(detSko1, type, owlClass);
        model.add(detSko2, type, owlClass);

        Model expected = mf.createEmptyModel();
        expected.add(bnode1, type, owlClass);
        expected.add(bnode4, type, owlClass);
        expected.add(bnode2, type, owlClass);
        expected.add(bnode5, type, owlClass);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void doesNotContainSubTest() {
        Model model = mf.createEmptyModel();
        model.add(detSko1, type, owlClass);

        Model expected = mf.createEmptyModel();
        expected.add(bnode1, type, owlClass);
        expected.add(bnode4, type, owlClass);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }

        assertFalse(result.contains(bnode5, type, owlClass));
    }

    @Test
    public void oneToOneObjTest() {
        Model model = mf.createEmptyModel();
        model.add(testIRI, type, detSko3);

        Model expected = mf.createEmptyModel();
        expected.add(testIRI, type, bnode3);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void oneToManyObjTest() {
        Model model = mf.createEmptyModel();
        model.add(testIRI, type, detSko1);

        Model expected = mf.createEmptyModel();
        expected.add(testIRI, type, bnode1);
        expected.add(testIRI, type, bnode4);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void manyToManyObjTest() {
        Model model = mf.createEmptyModel();
        model.add(testIRI, type, detSko1);
        model.add(testIRI, type, detSko2);

        Model expected = mf.createEmptyModel();
        expected.add(testIRI, type, bnode1);
        expected.add(testIRI, type, bnode4);
        expected.add(testIRI, type, bnode2);
        expected.add(testIRI, type, bnode5);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void doesNotContainObjTest() {
        Model model = mf.createEmptyModel();
        model.add(testIRI, type, detSko1);

        Model expected = mf.createEmptyModel();
        expected.add(testIRI, type, bnode1);
        expected.add(testIRI, type, bnode4);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }

        assertFalse(result.contains(testIRI, type, bnode5));
    }

    @Test
    public void oneToOneSubObjTest() {
        Model model = mf.createEmptyModel();
        model.add(detSko3, type, detSko3);

        Model expected = mf.createEmptyModel();
        expected.add(bnode3, type, bnode3);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void oneToManySubObjTest() {
        Model model = mf.createEmptyModel();
        model.add(detSko1, type, detSko1);

        Model expected = mf.createEmptyModel();
        expected.add(bnode1, type, bnode1);
        expected.add(bnode4, type, bnode4);
        expected.add(bnode4, type, bnode1);
        expected.add(bnode1, type, bnode4);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void manyToManySubObjTest() {
        Model model = mf.createEmptyModel();
        model.add(detSko2, type, detSko1);
        model.add(detSko1, type, detSko2);

        Model expected = mf.createEmptyModel();
        expected.add(bnode2, type, bnode1);
        expected.add(bnode5, type, bnode4);
        expected.add(bnode2, type, bnode4);
        expected.add(bnode5, type, bnode1);

        expected.add(bnode1, type, bnode2);
        expected.add(bnode4, type, bnode5);
        expected.add(bnode4, type, bnode2);
        expected.add(bnode1, type, bnode5);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void noBlankNodesTest() {
        Model model = mf.createEmptyModel();
        model.add(testIRI, type, owlClass);

        Model expected = mf.createEmptyModel();
        expected.add(testIRI, type, owlClass);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void blankNodeFallback_MCS_167() {
        Map<BNode, IRI> systemMap = new HashMap<>();
        BNode systemBNode = vf.createBNode();
        systemMap.put(systemBNode, detSko3);

        Model model = mf.createEmptyModel();
        model.add(testIRI, type, detSko3);

        Model expected = mf.createEmptyModel();
        expected.add(testIRI, type, systemBNode);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, systemMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void blankNodeFallback_MCS_167_NotInMap() {
        Map<BNode, IRI> systemMap = new HashMap<>();
        BNode systemBNode = vf.createBNode();
        systemMap.put(systemBNode, detSko1);

        Model model = mf.createEmptyModel();
        model.add(testIRI, type, detSko3);

        Model expected = mf.createEmptyModel();
        expected.add(testIRI, type, bnode3);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, systemMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void blankNodeFallback_MCS_167_hasBNodeSubject() {
        Map<BNode, IRI> systemMap = new HashMap<>();
        BNode systemBNode = vf.createBNode();
        systemMap.put(systemBNode, detSko3);

        Model model = mf.createEmptyModel();
        model.add(testIRI, type, detSko3);
        model.add(detSko3, type, owlClass);

        Model expected = mf.createEmptyModel();
        expected.add(testIRI, type, bnode3);
        expected.add(bnode3, type, owlClass);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, systemMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }
}
