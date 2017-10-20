package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import static com.mobi.persistence.utils.impl.SimpleBNodeService.SKOLEMIZED_NAMESPACE;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.mobi.persistence.utils.impl.SimpleBNodeService;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

public class SimpleBNodeServiceTest {

    private SimpleBNodeService service;

    @Mock private ValueFactory vf;
    @Mock private ModelFactory mf;

    @Mock private BNode bnode1;
    @Mock private BNode bnode2;

    private IRI skolemizedBnode1;
    private IRI skolemizedBnode2;
    private IRI predicate;
    private Resource subject;
    private Value object;
    private IRI skolemizedIRI1;
    private IRI skolemizedIRI2;
    private BNode deskolemizedIRI1;
    private BNode deskolemizedIRI2;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);

        when(vf.createIRI(anyString(), anyString())).thenAnswer(invocationOnMock -> {
            String arg1 = invocationOnMock.getArgumentAt(0, String.class);
            String arg2 = invocationOnMock.getArgumentAt(1, String.class);

            IRI iri = mock(IRI.class);
            when(iri.getNamespace()).thenReturn(arg1);
            when(iri.getLocalName()).thenReturn(arg2);
            when(iri.stringValue()).thenReturn(arg1 + arg2);
            when(iri.toString()).thenReturn(arg1 + arg2);
            return iri;
        });

        when(vf.createIRI(anyString())).thenAnswer(invocationOnMock -> {
            IRI iri = mock(IRI.class);
            when(iri.toString()).thenReturn(invocationOnMock.getArgumentAt(0, String.class));
            when(iri.stringValue()).thenReturn(invocationOnMock.getArgumentAt(0, String.class));
            return iri;
        });

        when(vf.createStatement(any(Resource.class), any(IRI.class), any(Value.class))).thenAnswer(invocationOnMock -> {
            Statement stmt = mock(Statement.class);
            when(stmt.getSubject()).thenReturn(invocationOnMock.getArgumentAt(0, Resource.class));
            when(stmt.getPredicate()).thenReturn(invocationOnMock.getArgumentAt(1, IRI.class));
            when(stmt.getObject()).thenReturn(invocationOnMock.getArgumentAt(2, Value.class));
            when(stmt.getContext()).thenReturn(Optional.empty());
            return stmt;
        });

        when(vf.createStatement(any(Resource.class), any(IRI.class), any(Value.class), any(Resource.class))).thenAnswer(invocationOnMock -> {
            Statement stmt = mock(Statement.class);
            when(stmt.getSubject()).thenReturn(invocationOnMock.getArgumentAt(0, Resource.class));
            when(stmt.getPredicate()).thenReturn(invocationOnMock.getArgumentAt(1, IRI.class));
            when(stmt.getObject()).thenReturn(invocationOnMock.getArgumentAt(2, Value.class));
            when(stmt.getContext()).thenReturn(Optional.ofNullable(invocationOnMock.getArgumentAt(3, Resource.class)));
            return stmt;
        });

        when(vf.createBNode(anyString())).thenAnswer(invocationOnMock -> {
            BNode bNode = mock(BNode.class);
            when(bNode.getID()).thenReturn(invocationOnMock.getArgumentAt(0, String.class));
            return bNode;
        });

        when(bnode1.getID()).thenReturn("1234");

        skolemizedBnode1 = vf.createIRI(SKOLEMIZED_NAMESPACE, bnode1.getID());
        skolemizedBnode2 = vf.createIRI(SKOLEMIZED_NAMESPACE, bnode2.getID());
        subject = vf.createIRI("http://mobi.com/", "subject");
        predicate = vf.createIRI("http://mobi.com/", "predicate");
        object = vf.createIRI("http://mobi.com/", "object");
        skolemizedIRI1 = vf.createIRI(SKOLEMIZED_NAMESPACE, "0");
        skolemizedIRI2 = vf.createIRI(SKOLEMIZED_NAMESPACE, "1");
        deskolemizedIRI1 = vf.createBNode(skolemizedIRI1.getLocalName());
        deskolemizedIRI2 = vf.createBNode(skolemizedIRI2.getLocalName());

        service = new SimpleBNodeService();
        service.setModelFactory(mf);
        service.setValueFactory(vf);
    }

    @Test
    public void testSkolemizeBNode() {
        IRI result = service.skolemize(bnode1);
        assertNotNull(result);
        assertEquals(SKOLEMIZED_NAMESPACE, result.getNamespace());
        assertEquals(bnode1.getID(), result.getLocalName());
    }

    @Test
    public void testSkolemizeValueThatIsBNode() {
        Value result = service.skolemize((Value) bnode1);
        assertTrue(result instanceof IRI);
        IRI iri = (IRI) result;
        assertNotNull(result);
        assertEquals(SKOLEMIZED_NAMESPACE, iri.getNamespace());
        assertEquals(bnode1.getID(), iri.getLocalName());
    }

    @Test
    public void testSkolemizeValueThatIsNotBNode() {
        Value value = vf.createIRI("https://mobi.com/value");
        Value result = service.skolemize(value);
        assertNotNull(result);
        assertEquals(result, value);
    }

    @Test
    public void testSkolemizeStatement() {
        Statement result = service.skolemize(vf.createStatement(bnode1, predicate, bnode2));
        assertNotNull(result);
        assertEquals(skolemizedBnode1.stringValue(), result.getSubject().stringValue());
        assertEquals(predicate.stringValue(), result.getPredicate().stringValue());
        assertEquals(skolemizedBnode2.stringValue(), result.getObject().stringValue());
    }

    @Test
    public void testSkolemizeStatementWithNoBNodes() {
        Statement result = service.skolemize(vf.createStatement(subject, predicate, object));
        assertEquals(subject, result.getSubject());
        assertEquals(predicate, result.getPredicate());
        assertEquals(object, result.getObject());
    }

    @Test
    public void testSkolemizeStatementWithContext() {
        Statement result = service.skolemize(vf.createStatement(subject, predicate, object, bnode1));
        assertEquals(subject, result.getSubject());
        assertEquals(predicate, result.getPredicate());
        assertEquals(object, result.getObject());
        assertTrue(result.getContext().isPresent());
        assertEquals(skolemizedBnode1.stringValue(), result.getContext().get().stringValue());
    }

    // TODO: How to test?
//    @Test
//    public void testSkolemizeModel() {
//        Statement stmt1 = vf.createStatement(bnode1, predicate, bnode2);
//        Statement stmt2 = vf.createStatement(subject, predicate, object);
//
//        Iterator<Statement> itr = mock(Iterator.class);
//        when(itr.hasNext()).thenReturn(true, true, false);
//        when(itr.next()).thenReturn(stmt1, stmt2);
//
//        Model modelMock = mock(Model.class);
//        when(modelMock.iterator()).thenReturn(itr);
//
////        Model modelMock2 = mock(Model.class);
////        when(mf.createModel()).thenReturn(modelMock2);
////        verify(modelMock2, times(2)).add(any(Statement.class));
//        verify(mockModel, times(2)).add(any(Statement.class));
////        Model model = mf.createModel();
////        model.add(vf.createStatement(bnode1, predicate, bnode2));
////        model.add(vf.createStatement(subject, predicate, object));
//        service.skolemize(modelMock);
////        assertEquals(2, result.size());
////        assertTrue(result.contains(skolemizedBnode1, predicate, skolemizedBnode2));
////        assertTrue(result.contains(subject, predicate, object));
//    }

    @Test
    public void testDeskolemizeIRI() {
        BNode result = service.deskolemize(skolemizedIRI1);
        assertEquals(skolemizedIRI1.getLocalName(), result.getID());
    }

    @Test
    public void testDeskolemizeValueThatIsSkolemizedIRI() {
        Value result = service.deskolemize((Value) skolemizedIRI1);
        assertTrue(result instanceof BNode);
        assertEquals(skolemizedIRI1.getLocalName(), ((BNode) result).getID());
    }

    @Test
    public void testDeskolemizeValueThatIsNotSkolemizedIRI() {
        Value result = service.deskolemize((Value) predicate);
        assertEquals(predicate, result);
    }

    @Test
    public void testDeskolemizeStatement() {
        Statement result = service.deskolemize(vf.createStatement(skolemizedIRI1, predicate, skolemizedIRI2));
        assertEquals(deskolemizedIRI1.stringValue(), result.getSubject().stringValue());
        assertEquals(predicate, result.getPredicate());
        assertEquals(deskolemizedIRI2.stringValue(), result.getObject().stringValue());
    }

    @Test
    public void testDeskolemizeStatementWithNoBNodes() {
        Statement result = service.deskolemize(vf.createStatement(subject, predicate, object));
        assertEquals(subject, result.getSubject());
        assertEquals(predicate, result.getPredicate());
        assertEquals(object, result.getObject());
    }

    @Test
    public void testDeskolemizeStatementWithContext() {
        Statement result = service.deskolemize(vf.createStatement(subject, predicate, object, skolemizedIRI1));
        assertEquals(subject, result.getSubject());
        assertEquals(predicate, result.getPredicate());
        assertEquals(object, result.getObject());
        assertTrue(result.getContext().isPresent());
        assertEquals(deskolemizedIRI1.stringValue(), result.getContext().get().stringValue());
    }

    // TODO: How to test?
//    @Test
//    public void testDeskolemizeModel() {
//        Model model = mf.createModel();
//        model.add(vf.createStatement(skolemizedIRI1, predicate, skolemizedIRI2));
//        model.add(vf.createStatement(subject, predicate, object));
//        Model result = service.deskolemize(model);
//        assertEquals(2, result.size());
//        assertTrue(result.contains(deskolemizedIRI1, predicate, deskolemizedIRI2));
//        assertTrue(result.contains(subject, predicate, object));
//    }
}
