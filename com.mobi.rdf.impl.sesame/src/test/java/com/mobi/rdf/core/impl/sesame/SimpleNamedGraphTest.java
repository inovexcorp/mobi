package com.mobi.rdf.core.impl.sesame;

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import org.junit.Test;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;

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
