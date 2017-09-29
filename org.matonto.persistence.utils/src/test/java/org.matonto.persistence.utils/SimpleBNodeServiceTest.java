package org.matonto.persistence.utils;

/*-
 * #%L
 * org.matonto.persistence.utils
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.matonto.persistence.utils.impl.SimpleBNodeService.BNODE_PREFIX;
import static org.matonto.persistence.utils.impl.SimpleBNodeService.SKOLEMIZED_NAMESPACE;

import org.junit.Before;
import org.junit.Test;
import org.matonto.persistence.utils.impl.SimpleBNodeService;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;

public class SimpleBNodeServiceTest {

    private SimpleBNodeService service;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();

    private final BNode bnode1 = vf.createBNode();
    private final BNode bnode2 = vf.createBNode();
    private final IRI skolemizedBnode1 = vf.createIRI(SKOLEMIZED_NAMESPACE + bnode1.getID());
    private final IRI skolemizedBnode2 = vf.createIRI(SKOLEMIZED_NAMESPACE + bnode2.getID());
    private final IRI predicate = vf.createIRI("http://matonto.org/predicate");
    private final Resource subject = vf.createIRI("http://matonto.org/subject");
    private final Value object = vf.createIRI("http://matonto.org/object");
    private final IRI skolemizedIRI1 = vf.createIRI(SKOLEMIZED_NAMESPACE + "0");
    private final IRI skolemizedIRI2 = vf.createIRI(SKOLEMIZED_NAMESPACE + "1");
    private final BNode deskolemizedIRI1 = vf.createBNode(skolemizedIRI1.getLocalName());
    private final BNode deskolemizedIRI2 = vf.createBNode(skolemizedIRI2.getLocalName());

    @Before
    public void setUp() throws Exception {
        service = new SimpleBNodeService();
        service.setModelFactory(mf);
        service.setValueFactory(vf);
    }

    @Test
    public void testSkolemizeBNode() {
        IRI result = service.skolemize(bnode1);
        assertEquals(SKOLEMIZED_NAMESPACE, result.getNamespace());
        assertEquals(bnode1.getID(), result.getLocalName());
    }

    @Test
    public void testSkolemizeValueThatIsBNode() {
        Value result = service.skolemize((Value) bnode1);
        assertTrue(result instanceof IRI);
        IRI iri = (IRI) result;
        assertEquals(SKOLEMIZED_NAMESPACE, iri.getNamespace());
        assertEquals(bnode1.getID(), iri.getLocalName());
    }

    @Test
    public void testSkolemizeValueThatIsNotBNode() {
        Value value = vf.createIRI("https://matonto.org/value");
        Value result = service.skolemize(value);
        assertEquals(result, value);
    }

    @Test
    public void testSkolemizeStatement() {
        Statement result = service.skolemize(vf.createStatement(bnode1, predicate, bnode2));
        assertEquals(skolemizedBnode1, result.getSubject());
        assertEquals(predicate, result.getPredicate());
        assertEquals(skolemizedBnode2, result.getObject());
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
        assertEquals(skolemizedBnode1, result.getContext().get());
    }

    @Test
    public void testSkolemizeModel() {
        Model model = mf.createModel();
        model.add(vf.createStatement(bnode1, predicate, bnode2));
        model.add(vf.createStatement(subject, predicate, object));
        Model result = service.skolemize(model);
        assertEquals(2, result.size());
        assertTrue(result.contains(skolemizedBnode1, predicate, skolemizedBnode2));
        assertTrue(result.contains(subject, predicate, object));
    }

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
        assertEquals(deskolemizedIRI1, result.getSubject());
        assertEquals(predicate, result.getPredicate());
        assertEquals(deskolemizedIRI2, result.getObject());
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
        assertEquals(deskolemizedIRI1, result.getContext().get());
    }

    @Test
    public void testDeskolemizeModel() {
        Model model = mf.createModel();
        model.add(vf.createStatement(skolemizedIRI1, predicate, skolemizedIRI2));
        model.add(vf.createStatement(subject, predicate, object));
        Model result = service.deskolemize(model);
        assertEquals(2, result.size());
        assertTrue(result.contains(deskolemizedIRI1, predicate, deskolemizedIRI2));
        assertTrue(result.contains(subject, predicate, object));
    }
}
