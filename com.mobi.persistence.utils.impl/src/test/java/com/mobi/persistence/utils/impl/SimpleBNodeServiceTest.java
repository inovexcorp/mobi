package com.mobi.persistence.utils.impl;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.io.InputStream;

public class SimpleBNodeServiceTest extends OrmEnabledTestCase {

    private SimpleBNodeService service;

    private final BNode bnode1 = VALUE_FACTORY.createBNode("1234");
    private final BNode bnode2 = VALUE_FACTORY.createBNode("5678");

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
        skolemizedBnode1 = VALUE_FACTORY.createIRI(SKOLEMIZED_NAMESPACE, bnode1.getID());
        skolemizedBnode2 = VALUE_FACTORY.createIRI(SKOLEMIZED_NAMESPACE, bnode2.getID());
        subject = VALUE_FACTORY.createIRI("http://mobi.com/", "subject");
        predicate = VALUE_FACTORY.createIRI("http://mobi.com/", "predicate");
        object = VALUE_FACTORY.createIRI("http://mobi.com/", "object");
        skolemizedIRI1 = VALUE_FACTORY.createIRI(SKOLEMIZED_NAMESPACE, "0");
        skolemizedIRI2 = VALUE_FACTORY.createIRI(SKOLEMIZED_NAMESPACE, "1");
        deskolemizedIRI1 = VALUE_FACTORY.createBNode(skolemizedIRI1.getLocalName());
        deskolemizedIRI2 = VALUE_FACTORY.createBNode(skolemizedIRI2.getLocalName());

        service = new SimpleBNodeService();
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
        Value value = VALUE_FACTORY.createIRI("https://mobi.com/value");
        Value result = service.skolemize(value);
        assertNotNull(result);
        assertEquals(result, value);
    }

    @Test
    public void testSkolemizeStatement() {
        Statement result = service.skolemize(VALUE_FACTORY.createStatement(bnode1, predicate, bnode2));
        assertNotNull(result);
        assertEquals(skolemizedBnode1.stringValue(), result.getSubject().stringValue());
        assertEquals(predicate.stringValue(), result.getPredicate().stringValue());
        assertEquals(skolemizedBnode2.stringValue(), result.getObject().stringValue());
    }

    @Test
    public void testSkolemizeStatementWithNoBNodes() {
        Statement result = service.skolemize(VALUE_FACTORY.createStatement(subject, predicate, object));
        assertEquals(subject, result.getSubject());
        assertEquals(predicate, result.getPredicate());
        assertEquals(object, result.getObject());
    }

    @Test
    public void testSkolemizeStatementWithContext() {
        Statement result = service.skolemize(VALUE_FACTORY.createStatement(subject, predicate, object, bnode1));
        assertEquals(subject, result.getSubject());
        assertEquals(predicate, result.getPredicate());
        assertEquals(object, result.getObject());
        assertNotNull(result.getContext());
        assertEquals(skolemizedBnode1.stringValue(), result.getContext().stringValue());
    }

    // TODO: How to test?
//    @Test
//    public void testSkolemizeModel() {
//        Statement stmt1 = VALUE_FACTORY.createStatement(bnode1, predicate, bnode2);
//        Statement stmt2 = VALUE_FACTORY.createStatement(subject, predicate, object);
//
//        Iterator<Statement> itr = mock(Iterator.class);
//        when(itr.hasNext()).thenReturn(true, true, false);
//        when(itr.next()).thenReturn(stmt1, stmt2);
//
//        Model modelMock = mock(Model.class);
//        when(modelMock.iterator()).thenReturn(itr);
//
////        Model modelMock2 = mock(Model.class);
////        when(mf.createEmptyModel()).thenReturn(modelMock2);
////        verify(modelMock2, times(2)).add(any(Statement.class));
//        verify(mockModel, times(2)).add(any(Statement.class));
////        Model model = mf.createEmptyModel();
////        model.add(VALUE_FACTORY.createStatement(bnode1, predicate, bnode2));
////        model.add(VALUE_FACTORY.createStatement(subject, predicate, object));
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
        Statement result = service.deskolemize(VALUE_FACTORY.createStatement(skolemizedIRI1, predicate, skolemizedIRI2));
        assertEquals(deskolemizedIRI1.stringValue(), result.getSubject().stringValue());
        assertEquals(predicate, result.getPredicate());
        assertEquals(deskolemizedIRI2.stringValue(), result.getObject().stringValue());
    }

    @Test
    public void testDeskolemizeStatementWithNoBNodes() {
        Statement result = service.deskolemize(VALUE_FACTORY.createStatement(subject, predicate, object));
        assertEquals(subject, result.getSubject());
        assertEquals(predicate, result.getPredicate());
        assertEquals(object, result.getObject());
    }

    @Test
    public void testDeskolemizeStatementWithContext() {
        Statement result = service.deskolemize(VALUE_FACTORY.createStatement(subject, predicate, object, skolemizedIRI1));
        assertEquals(subject, result.getSubject());
        assertEquals(predicate, result.getPredicate());
        assertEquals(object, result.getObject());
        assertNotNull(result.getContext());
        assertEquals(deskolemizedIRI1.stringValue(), result.getContext().stringValue());
    }

    // TODO: How to test?
//    @Test
//    public void testDeskolemizeModel() {
//        Model model = mf.createEmptyModel();
//        model.add(VALUE_FACTORY.createStatement(skolemizedIRI1, predicate, skolemizedIRI2));
//        model.add(VALUE_FACTORY.createStatement(subject, predicate, object));
//        Model result = service.deskolemize(model);
//        assertEquals(2, result.size());
//        assertTrue(result.contains(deskolemizedIRI1, predicate, deskolemizedIRI2));
//        assertTrue(result.contains(subject, predicate, object));
//    }

    // Deterministic Skolemize Tests
    @Test
    public void skolemizeOnlyIRIs_01() throws Exception {
        Model modelA = getModelFromFile("/deterministicSkolemize/01-A.ttl");
        Model modelB = getModelFromFile("/deterministicSkolemize/01-B.ttl");

        modelA = service.deterministicSkolemize(modelA);
        modelB = service.deterministicSkolemize(modelB);

        assertEquals(modelA, modelB);
    }

    @Test
    public void skolemizeOnlyDetachedBNodes_02() throws Exception {
        Model modelA = getModelFromFile("/deterministicSkolemize/02-A.ttl");
        Model modelB = getModelFromFile("/deterministicSkolemize/02-B.ttl");

        modelA = service.deterministicSkolemize(modelA);
        modelB = service.deterministicSkolemize(modelB);

        assertTrue(modelA.containsAll(modelB));
    }

    @Test
    public void skolemizeIRIsAndDetachedBNodes_03() throws Exception {
        Model modelA = getModelFromFile("/deterministicSkolemize/03-A.ttl");
        Model modelB = getModelFromFile("/deterministicSkolemize/03-B.ttl");

        modelA = service.deterministicSkolemize(modelA);
        modelB = service.deterministicSkolemize(modelB);

        assertTrue(modelA.containsAll(modelB));
    }

    @Test
    public void skolemizeConnectedIRIsAndBNodes_04() throws Exception {
        Model modelA = getModelFromFile("/deterministicSkolemize/04-A.ttl");
        Model modelB = getModelFromFile("/deterministicSkolemize/04-B.ttl");

        modelA = service.deterministicSkolemize(modelA);
        modelB = service.deterministicSkolemize(modelB);

        assertTrue(modelA.containsAll(modelB));
    }

    @Test
    public void skolemizeChainedBNodes_05() throws Exception {
        Model modelA = getModelFromFile("/deterministicSkolemize/05-A.ttl");
        Model modelB = getModelFromFile("/deterministicSkolemize/05-B.ttl");

        modelA = service.deterministicSkolemize(modelA);
        modelB = service.deterministicSkolemize(modelB);

        assertTrue(modelA.containsAll(modelB));
    }

    @Test
    public void skolemizeAircraftDesign() throws Exception {
        InputStream streamA = getClass().getResourceAsStream("/deterministicSkolemize/AircraftDesign.rdf");
        Model modelA = Rio.parse(streamA, "", RDFFormat.RDFXML);
        Model modelB = getModelFromFile("/deterministicSkolemize/AircraftDesign.ttl");

        modelA = service.deterministicSkolemize(modelA);
        modelB = service.deterministicSkolemize(modelB);

        Model mA = MODEL_FACTORY.createEmptyModel();
        mA.addAll(modelA);
        mA.removeAll(modelB);
        modelB.removeAll(modelA);

        assertTrue(modelA.containsAll(modelB));
    }

    @Test
    public void skolemizeDuplicatedBNodes_06() throws Exception {
        Model modelA = getModelFromFile("/deterministicSkolemize/06-A.ttl");

        modelA = service.deterministicSkolemize(modelA);

        assertEquals(modelA.subjects().size(), 7);
    }

    @Test
    public void skolemizeChainedDuplicatedBNodes_07() throws Exception {
        Model modelA = getModelFromFile("/deterministicSkolemize/07-A.ttl");
        Model modelB = getModelFromFile("/deterministicSkolemize/07-B.ttl");

        modelA = service.deterministicSkolemize(modelA);
        modelB = service.deterministicSkolemize(modelB);

        Model mA = MODEL_FACTORY.createEmptyModel();
        mA.addAll(modelA);
        mA.removeAll(modelB);
        modelB.removeAll(modelA);

        assertTrue(modelA.containsAll(modelB));
    }

    @Test
    public void skolemizeDetachedBlankNode_08() throws Exception {
        Model modelA = getModelFromFile("/deterministicSkolemize/08-A.ttl");
        Model modelB = getModelFromFile("/deterministicSkolemize/08-B.ttl");

        modelA = service.deterministicSkolemize(modelA);
        modelB = service.deterministicSkolemize(modelB);

        Model mA = MODEL_FACTORY.createEmptyModel();
        mA.addAll(modelA);
        mA.removeAll(modelB);
        modelB.removeAll(modelA);

        assertTrue(modelA.containsAll(modelB));
    }

    @Test
    public void skolemizeCycles_09() throws Exception {
        Model modelA = getModelFromFile("/deterministicSkolemize/09.ttl");

        modelA = service.deterministicSkolemize(modelA);

        assertEquals(12, modelA.size());
    }

    private Model getModelFromFile(String file) throws IOException {
        InputStream streamA = getClass().getResourceAsStream(file);
        return Rio.parse(streamA, "", RDFFormat.TURTLE);
    }
}
