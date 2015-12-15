package org.matonto.rdf.core.impl.sesame;

import org.junit.Test;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Literal;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;

public class SimpleNamedGraphTest {

    @Test
    public void testEquals() {
        IRI s = new SimpleIRI("http://test.com/s");
        IRI p = new SimpleIRI("http://test.com/p");
        IRI o = new SimpleIRI("http://test.com/o");
        Literal o2 = new SimpleLiteral("MatOnto");
        BNode b = new SimpleBNode("_:matonto1");
        BNode b2 = new SimpleBNode("_:matonto2");

        SimpleNamedGraph graph1 = new SimpleNamedGraph(new SimpleIRI("http://test.com/NG1"));
        SimpleNamedGraph graph2 = new SimpleNamedGraph(new SimpleIRI("http://test.com/NG1"));
        SimpleNamedGraph graph3 = new SimpleNamedGraph(new SimpleIRI("http://test.com/NG3"));
        SimpleNamedGraph graph4 = new SimpleNamedGraph(new SimpleIRI("http://test.com/NG4"));
        SimpleNamedGraph graph5 = new SimpleNamedGraph(new SimpleIRI("http://test.com/NG4"));
        SimpleNamedGraph graph6 = new SimpleNamedGraph(new SimpleIRI("http://test.com/NG6"));
        SimpleNamedGraph graph7 = new SimpleNamedGraph(new SimpleIRI("http://test.com/NG6"));

        graph1.add(s, p, o);
        graph2.add(s, p, o);

        graph4.add(s, p, o);
        graph4.add(s, p, b);
        graph4.add(b, p, o2);
        graph5.add(s, p, o);
        graph5.add(s, p, b);
        graph5.add(b, p, o2);

        graph6.add(s, p, b);
        graph6.add(b, p, o2);
        graph7.add(s, p, b2);
        graph7.add(b2, p, o2);

        assertEquals(graph1, graph2);
        assertEquals(graph4, graph5);
        assertNotEquals(graph1, graph3);
        assertEquals(graph6, graph7);
    }
}
