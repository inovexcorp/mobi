package com.mobi.rdf.core.impl.sesame

import com.mobi.rdf.api.Statement
import com.mobi.rdf.api.Statement
import spock.lang.Specification
import org.openrdf.model.impl.LinkedHashModel

class SimpleNamedGraphSpec extends Specification {

    def model = new SesameModelWrapper(new LinkedHashModel())
    def graphID = new SimpleIRI("http://test.com/NG/1")
    def graph = new SimpleNamedGraph(graphID, model)

    def "add(s, p, o) returns boolean"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")

        expect:
        graph.add(s, p, o)
    }

    def "add(stmt) returns boolean"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        def stmt = new SimpleStatement(s, p, o, graphID)
        def stmt2 = new SimpleStatement(s, p, o2, graphID)

        expect:
        graph.add(stmt)
        graph.size() == 1
        graph.add(stmt2)
        graph.size() == 2
        !graph.add(stmt)
        graph.size() == 2
    }

    def "add(stmt) with null returns boolean"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def graph2 = new SimpleNamedGraph(null)
        def stmt = new SimpleStatement(s, p, o, null)

        expect:
        graph2.add(stmt)
        graph2.size() == 1
    }

    def "addAll(model) returns boolean"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def model = new SesameModelWrapper(new LinkedHashModel())
        model.add(s, p, o, graphID)

        expect:
        graph.addAll(model)
        graph.size() == 1
    }

    def "clear() clears model"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        graph.add(s, p, o)
        graph.clear()

        expect:
        graph.size() == 0;

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
    }

    def "filter(s, p, o, c) returns the correct model"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def s2 = new SimpleIRI("http://test.com/s2")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        graph.add(s, p, o)
        graph.add(s, p, o2)

        expect:
        graph.filter(s, null, null).size() == 2
        graph.filter(s, p, o).size() == 1
        graph.filter(null, null, null).size() == 2
        graph.filter(null, null, o2).size() == 1
        graph.filter(null, p, null).size() == 2
        graph.filter(s2, null, null).size() == 0
    }

    def "setNamespace(ns) works"() {
        setup:
        def ns = new SimpleNamespace("http://test.com#", "Classname")
        graph.setNamespace(ns)

        expect:
        graph.getNamespaces().size() == 1
        graph.getNamespaces()[0] == ns
    }

    def "setNamespace(prefix, name) works"() {
        setup:
        graph.setNamespace("http://test.com#", "Classname")

        expect:
        graph.getNamespaces().size() == 1
        graph.getNamespaces()[0].getPrefix() == "http://test.com#"
    }

    def "getNamespace(prefix) works"() {
        setup:
        def ns = new SimpleNamespace("http://test.com#", "Classname")
        graph.setNamespace(ns)

        expect:
        graph.getNamespace("http://test.com#").get() == ns
        graph.getNamespace("http://test1.com#") == Optional.empty()
    }

    def "removeNamespace(prefix) works"() {
        setup:
        def ns = new SimpleNamespace("http://test.com#", "Classname")
        graph.setNamespace(ns)

        expect:
        graph.removeNamespace("http://test.com#").get() == ns
        graph.removeNamespace("http://test1.com#") == Optional.empty()
    }

    def "remove(s, p, o, c) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def s2 = new SimpleIRI("http://test.com/s2")
        def p = new SimpleIRI("http://test.com/p")
        def p2 = new SimpleIRI("http://test.com/p2")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        graph.add(s, p, o)
        graph.add(s, p2, o)
        graph.add(s, p, o2)

        expect:
        graph.remove(s, p, o)
        graph.size() == 2
        !graph.remove(s2, null, null)
        graph.size() == 2
        graph.remove(s, p2, o)
        graph.size() == 1
        graph.remove(s, null, null)
        graph.size() == 0
        !graph.remove(null, null, null)
    }

    def "remove(stmt) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        def c1 = new SimpleIRI("http://test.com/c1")
        def stmt = new SimpleStatement(s, p, o, graphID)
        def stmt2 = new SimpleStatement(s, p, o, c1)
        def stmt3 = new SimpleStatement(s, p, o2, graphID)
        graph.add(s, p, o)
        graph.add(s, p, o2)

        expect:
        graph.size() == 2
        graph.remove(stmt)
        graph.size() == 1
        !graph.remove(stmt2)
        graph.size() == 1
        graph.remove(stmt3)
        graph.size() == 0
    }

    def "unmodifiable().add(s, p, o) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        graph.add(s, p, o)

        when:
        graph.unmodifiable().add(s, p, o2)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().add(stmt) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        def stmt = new SimpleStatement(s, p, o2, graphID)
        graph.add(s, p, o)

        when:
        graph.unmodifiable().add(stmt)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().addAll(model) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o, graphID)

        when:
        graph.unmodifiable().addAll(model2)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().remove(s, p, o) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        graph.add(s, p, o)

        when:
        graph.unmodifiable().remove(s, null, null)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().remove(stmt) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def stmt = new SimpleStatement(s, p, o, graphID)
        graph.add(s, p, o)

        when:
        graph.unmodifiable().remove(stmt)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().retainAll(model) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        graph.add(s, p, o)
        graph.add(s, p, o2)
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o, graphID)

        when:
        graph.unmodifiable().retainAll(model2)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().clear() throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        graph.add(s, p, o)

        when:
        graph.unmodifiable().clear()

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().removeNamespace(prefix) throws an UnsupportedOperationException"() {
        setup:
        def ns = new SimpleNamespace("http://test.com#", "Classname")
        graph.setNamespace(ns)

        when:
        graph.unmodifiable().removeNamespace("http://test.com#")

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().setNamespace(ns) throws an UnsupportedOperationException"() {
        setup:
        def ns = new SimpleNamespace("http://test.com#", "Classname")

        when:
        graph.unmodifiable().setNamespace(ns)

        then:
        thrown(UnsupportedOperationException)
    }

    def "retainAll(model) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        def o3 = new SimpleLiteral("MatOnto3")
        graph.add(s, p, o)
        graph.add(s, p, o2)
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o, graphID)
        def model3 = new SesameModelWrapper(new LinkedHashModel())
        model3.add(s, p, o3, graphID)

        expect:
        graph.size() == 2
        graph.retainAll(model2)
        graph.size() == 1
        !graph.retainAll(model2)
        graph.size() == 1
        !graph.retainAll(graph)
        graph.size() == 1
        graph.retainAll(model3)
        graph.size() == 0
    }

    def "removeAll(model) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        def o3 = new SimpleLiteral("MatOnto3")
        graph.add(s, p, o)
        graph.add(s, p, o2)
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o, graphID)
        def model3 = new SesameModelWrapper(new LinkedHashModel())
        model3.add(s, p, o3, graphID)

        expect:
        graph.size() == 2
        graph.removeAll(model2)
        graph.size() == 1
        !graph.removeAll(model2)
        graph.size() == 1
        !graph.removeAll(model3)
        graph.size() == 1
        graph.removeAll(graph)
        graph.size() == 0
    }

    def "contains(object) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        def c1 = new SimpleIRI("http://test.com/c1")
        def stmt = new SimpleStatement(s, p, o, graphID)
        def stmt2 = new SimpleStatement(s, p, o, c1)
        def stmt3 = new SimpleStatement(s, p, o2)
        graph.add(s, p, o)

        expect:
        graph.contains(stmt)
        !graph.contains(stmt2)
        !graph.contains(stmt3)
    }

    def "contains(s, p, o) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        graph.add(s, p, o)

        expect:
        graph.contains(s, p, o)
        graph.contains(s, null, null)
        graph.contains(s, p, null)
        graph.contains(null, p, o)
        graph.contains(null, null, o)
        graph.contains(null, null, null)
        !graph.contains(null, null, o2)
    }

    def "containsAll(model) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("MatOnto")
        def c1 = new SimpleIRI("http://test.com/c1")
        graph.add(s, p, o)
        def model = new SesameModelWrapper(new LinkedHashModel())
        model.add(s, p, o, graphID)
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o, c1)
        model2.add(s, p, o, graphID)
        model2.add(s, p, o2, graphID)

        expect:
        graph.containsAll(model)
        !graph.containsAll(model2)
    }

    def "toArray() returns an Object Array"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        graph.add(s, p, o)

        expect:
        graph.toArray().length == 1
    }

    def "toArray(Statement[]) returns an Object Array"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def stmt = new SimpleStatement(s, p, o, graphID)
        graph.add(stmt)
        def stmts = new Statement[1]

        expect:
        graph.toArray(stmts).length == 1
        graph.toArray(stmts)[0] == stmt
    }

    def "iterator() next() works"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def stmt = new SimpleStatement(s, p, o, graphID)
        graph.add(stmt)
        def itr = graph.iterator()

        expect:
        itr.hasNext()
        itr.next() == stmt
    }

    def "iterator() remove() works"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def stmt = new SimpleStatement(s, p, o, graphID)
        graph.add(stmt)
        def itr = graph.iterator()
        itr.hasNext()
        itr.next()
        itr.remove()

        expect:
        graph.size() == 0
    }

    def "size() returns the correct size"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def stmt = new SimpleStatement(s, p, o, graphID)
        graph.add(stmt)

        expect:
        graph.size() == 1
    }

    def "empty() returns the correct size"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def stmt = new SimpleStatement(s, p, o, graphID)
        graph.add(stmt)
        def graph2 = new SimpleNamedGraph()

        expect:
        !graph.isEmpty()
        graph2.isEmpty()
    }

    def "hashCode() returns the same int"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def stmt = new SimpleStatement(s, p, o, graphID)
        graph.add(stmt)
        def graph2 = new SimpleNamedGraph(graphID)
        graph2.add(stmt)

        expect:
        graph.hashCode() == graph2.hashCode()
    }
}
