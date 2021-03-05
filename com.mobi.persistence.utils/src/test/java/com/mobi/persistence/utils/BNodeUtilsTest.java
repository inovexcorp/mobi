package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;

import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import org.eclipse.rdf4j.model.impl.LinkedHashModelFactory;
import org.eclipse.rdf4j.model.impl.SimpleValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;

public class BNodeUtilsTest {

    @Mock
    private ValueFactory vf;

    @Mock
    private ModelFactory mf;

    private org.eclipse.rdf4j.model.ValueFactory sesameVf = SimpleValueFactory.getInstance();
    private org.eclipse.rdf4j.model.ModelFactory sesameMf = new LinkedHashModelFactory();

    private Map<BNode, IRI> bNodeIRIMap = new HashMap<>();
    private Map<String, Resource> mockTrack = new HashMap<>();
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
        MockitoAnnotations.initMocks(this);

        // Stub BNode creation
        when(vf.createBNode()).thenAnswer(invocation -> {
            org.eclipse.rdf4j.model.BNode sesameBNode = sesameVf.createBNode();
            BNode bNode = mock(BNode.class, withSettings().extraInterfaces(Resource.class));
            when(bNode.getID()).thenReturn(sesameBNode.getID());
            mockTrack.put(sesameBNode.getID(), bNode);
            return bNode;
        });

        ArgumentCaptor<String> id = ArgumentCaptor.forClass(String.class);
        when(vf.createBNode(id.capture())).thenAnswer(invocation -> {
            org.eclipse.rdf4j.model.BNode sesameBNode = sesameVf.createBNode(id.getValue());
            BNode bNode = mock(BNode.class, withSettings().extraInterfaces(Resource.class));
            when(bNode.getID()).thenReturn(sesameBNode.getID());
            mockTrack.put(id.getValue(), bNode);
            return bNode;
        });

        // Stub IRI creation
        ArgumentCaptor<String> iriCaptor = ArgumentCaptor.forClass(String.class);
        when(vf.createIRI(iriCaptor.capture())).thenAnswer(invocation -> {
            org.eclipse.rdf4j.model.IRI sesameIRI = sesameVf.createIRI(iriCaptor.getValue());
            IRI iri = mock(IRI.class, withSettings().extraInterfaces(Resource.class));
            when(iri.stringValue()).thenReturn(sesameIRI.stringValue());
            mockTrack.put(sesameIRI.stringValue(), iri);
            return iri;
        });

        // Stub model creation
        when(mf.createModel()).thenAnswer(invocation -> {
            org.eclipse.rdf4j.model.Model sesameModel = sesameMf.createEmptyModel();
            Model model = mock(Model.class);

            // Stub adding statements to model
            ArgumentCaptor<Resource> subCaptor = ArgumentCaptor.forClass(Resource.class);
            ArgumentCaptor<IRI> predCaptor = ArgumentCaptor.forClass(IRI.class);
            ArgumentCaptor<Resource> objCaptor = ArgumentCaptor.forClass(Resource.class);
            when(model.add(subCaptor.capture(), predCaptor.capture(), objCaptor.capture())).thenAnswer(invocation2 -> {
                Resource sub = subCaptor.getValue();
                org.eclipse.rdf4j.model.Resource sesameSub = sub instanceof BNode ?
                        sesameVf.createBNode(((BNode) sub).getID()) : sesameVf.createIRI(sub.stringValue());
                Resource obj = objCaptor.getValue();
                org.eclipse.rdf4j.model.Resource sesameObj = obj instanceof BNode ?
                        sesameVf.createBNode(((BNode) obj).getID()) : sesameVf.createIRI(obj.stringValue());
                sesameModel.add(sesameSub, sesameVf.createIRI(predCaptor.getValue().stringValue()), sesameObj);
                return true;
            });

            // Stub size
            when(model.size()).thenAnswer(invocation2 -> sesameModel.size());

            // Stub retrieving an iterator
            when(model.iterator()).thenAnswer(invocation2 -> {
                Iterator<Statement> iterator = mock(Iterator.class);
                Iterator<org.eclipse.rdf4j.model.Statement> sesameIterator = sesameModel.iterator();
                when(iterator.hasNext()).thenAnswer(invocation3 -> sesameIterator.hasNext());
                when(iterator.next()).thenAnswer(invocation3 -> {
                    Statement statement = mock(Statement.class);
                    org.eclipse.rdf4j.model.Statement sesameStatement = sesameIterator.next();

                    Resource sub = mockTrack.get(sesameStatement.getSubject().stringValue());
                    when(statement.getSubject()).thenReturn(sub);

                    IRI pred = vf.createIRI(sesameStatement.getPredicate().stringValue());
                    when(statement.getPredicate()).thenReturn(pred);

                    Resource obj = mockTrack.get(sesameStatement.getObject().stringValue());
                    when(statement.getObject()).thenReturn(obj);

                    when(statement.getContext()).thenReturn(Optional.empty());
                    return statement;
                });
                return iterator;
            });

            // Stub model contains
            ArgumentCaptor<Resource> subCaptor2 = ArgumentCaptor.forClass(Resource.class);
            ArgumentCaptor<IRI> predCaptor2 = ArgumentCaptor.forClass(IRI.class);
            ArgumentCaptor<Value> objCaptor2 = ArgumentCaptor.forClass(Value.class);
            when(model.contains(subCaptor2.capture(), predCaptor2.capture(), objCaptor2.capture())).thenAnswer(invocation2 -> {
                Resource sub = subCaptor2.getValue();
                IRI pred = predCaptor2.getValue();
                Value obj = objCaptor2.getValue();
                org.eclipse.rdf4j.model.Resource sesameSub = sub instanceof BNode ?
                        sesameVf.createBNode(((BNode) sub).getID()) : sesameVf.createIRI(sub.stringValue());
                org.eclipse.rdf4j.model.Resource sesameObj = obj instanceof BNode ?
                        sesameVf.createBNode(((BNode) obj).getID()) : sesameVf.createIRI(obj.stringValue());

                return sesameModel.contains(sesameSub, sesameVf.createIRI(pred.stringValue()), sesameObj);
            });

            return model;
        });

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
        Model model = mf.createModel();
        model.add(detSko3, type, owlClass);

        Model expected = mf.createModel();
        expected.add(bnode3, type, owlClass);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void oneToManySubTest() {
        Model model = mf.createModel();
        model.add(detSko1, type, owlClass);

        Model expected = mf.createModel();
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
        Model model = mf.createModel();
        model.add(detSko1, type, owlClass);
        model.add(detSko2, type, owlClass);

        Model expected = mf.createModel();
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
        Model model = mf.createModel();
        model.add(detSko1, type, owlClass);

        Model expected = mf.createModel();
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
        Model model = mf.createModel();
        model.add(testIRI, type, detSko3);

        Model expected = mf.createModel();
        expected.add(testIRI, type, bnode3);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void oneToManyObjTest() {
        Model model = mf.createModel();
        model.add(testIRI, type, detSko1);

        Model expected = mf.createModel();
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
        Model model = mf.createModel();
        model.add(testIRI, type, detSko1);
        model.add(testIRI, type, detSko2);

        Model expected = mf.createModel();
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
        Model model = mf.createModel();
        model.add(testIRI, type, detSko1);

        Model expected = mf.createModel();
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
        Model model = mf.createModel();
        model.add(detSko3, type, detSko3);

        Model expected = mf.createModel();
        expected.add(bnode3, type, bnode3);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }

    @Test
    public void oneToManySubObjTest() {
        Model model = mf.createModel();
        model.add(detSko1, type, detSko1);

        Model expected = mf.createModel();
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
        Model model = mf.createModel();
        model.add(detSko2, type, detSko1);
        model.add(detSko1, type, detSko2);

        Model expected = mf.createModel();
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
        Model model = mf.createModel();
        model.add(testIRI, type, owlClass);

        Model expected = mf.createModel();
        expected.add(testIRI, type, owlClass);

        Model result = BNodeUtils.restoreBNodes(model, bNodeIRIMap, mf);
        assertEquals(expected.size(), result.size());
        for (Statement statement : expected) {
            assertTrue(result.contains(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        }
    }
}
