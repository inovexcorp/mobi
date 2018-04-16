package com.mobi.rdf.core.impl.sesame

import com.mobi.rdf.api.Statement
import org.eclipse.rdf4j.model.impl.LinkedHashModel
import spock.lang.Specification

class SesameModelWrapperSpec extends Specification {

    def model = new SesameModelWrapper(new LinkedHashModel())

    def "add(s, p, o, c...) returns boolean"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")

        expect:
        model.add(s, p, o)
        !model.add(s, p, o)
        model.add(s, p, o, c1)
        !model.add(s, p, o, c1)
        model.add(s, p, o, c1, c2)
    }

    def "add(s, p, o, c) with Bnode and IRI are treated separately"() {
        setup:
        def s1 = new SimpleIRI("urn:s1")
        def s2 = new SimpleBNode("urn:s1")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("urn:test1")
        def c2 = new SimpleBNode("urn:test1")

        expect:
        model.add(s1, p, o, c1)
        model.add(s1, p, o, c2)
        model.add(s2, p, o, c2)
        model.size() == 3
        model.contexts().size() == 2
    }

    def "add(stmt) returns boolean"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        def stmt = new SimpleStatement(s, p, o)
        def stmt2 = new SimpleStatement(s, p, o, c1)
        def stmt3 = new SimpleStatement(s, p, o, c2)
        def stmt4 = new SimpleStatement(s, p, o2, null)

        expect:
        model.add(stmt)
        model.size() == 1
        !model.add(stmt)
        model.size() == 1
        model.add(stmt2)
        model.size() == 2
        model.add(stmt3)
        model.size() == 3
        model.add(stmt4)
        model.size() == 4
    }

    def "addAll(model) returns boolean"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o)
        model2.add(s, p, o, c1)

        expect:
        model.addAll(model2)
        model.size() == 2
    }

    def "clear() clears model"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        model.add(s, p, o)
        model.clear()

        expect:
        model.size() == 0;

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

    def "clear(c...) with one context returns boolean"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        model.add(s, p, o, c1)

        expect:
        !model.clear(c2)
        model.clear(c1)
    }

    def "clear(c...) with two context returns boolean"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        model.add(s, p, o, c1, c2)

        expect:
        model.clear(c1, c2)
    }

    def "clear() with two context returns boolean"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        model.add(s, p, o, c1, c2)

        expect:
        model.clear()
    }

    def "filter(s, p, o, c) returns the correct model"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def s2 = new SimpleIRI("http://test.com/s2")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        model.add(s, p, o, c1, c2)
        model.add(s, p, o2)

        expect:
        model.filter(s, null, null).size() == 3
        model.filter(s, p, o).size() == 2
        model.filter(null, null, null).size() == 3
        model.filter(null, null, o2).size() == 1
        model.filter(null, p, null).size() == 3
        model.filter(s2, null, null).size() == 0
        model.filter(null, null, null, c1).size() == 1
        model.filter(null, null, null, c2).size() == 1
        model.filter(null, null, null, c1, c2).size() == 2
        model.filter(null, null, null, null).size() == 1
    }

    def "setNamespace(ns) works"() {
        setup:
        def ns = new SimpleNamespace("http://test.com#", "Classname")
        model.setNamespace(ns)

        expect:
        model.getNamespaces().size() == 1
        model.getNamespaces()[0] == ns
    }

    def "setNamespace(prefix, name) works"() {
        setup:
        model.setNamespace("http://test.com#", "Classname")

        expect:
        model.getNamespaces().size() == 1
        model.getNamespaces()[0].getPrefix() == "http://test.com#"
    }

    def "getNamespace(prefix) works"() {
        setup:
        def ns = new SimpleNamespace("http://test.com#", "Classname")
        model.setNamespace(ns)

        expect:
        model.getNamespace("http://test.com#").get() == ns
        model.getNamespace("http://test1.com#") == Optional.empty()
    }

    def "removeNamespace(prefix) works"() {
        setup:
        def ns = new SimpleNamespace("http://test.com#", "Classname")
        model.setNamespace(ns)

        expect:
        model.removeNamespace("http://test.com#").get() == ns
        model.removeNamespace("http://test1.com#") == Optional.empty()
    }

    def "remove(s, p, o, c) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def s2 = new SimpleIRI("http://test.com/s2")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        model.add(s, p, o, c1, c2)
        model.add(s, p, o2)

        expect:
        model.remove(s, p, o, c2)
        model.size() == 2
        !model.remove(s, p, o, null)
        !model.remove(s2, null, null)
        model.size() == 2
        model.remove(s, p, o)
        model.size() == 1
        model.remove(s, null, null)
        model.size() == 0
        !model.remove(null, null, null)
    }

    def "remove(stmt) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        def stmt = new SimpleStatement(s, p, o)
        def stmt2 = new SimpleStatement(s, p, o2, c1)
        def stmt3 = new SimpleStatement(s, p, o2, null)
        def stmt4 = new SimpleStatement(s, p, o2)
        model.add(s, p, o)
        model.add(s, p, o2, c1, c2)

        expect:
        model.size() == 3
        model.remove(stmt)
        model.size() == 2
        model.remove(stmt2)
        model.size() == 1
        !model.remove(stmt3)
        model.size() == 1
        !model.remove(stmt4)
        model.size() == 1
    }

    def "unmodifiable().add(s, p, o) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        model.add(s, p, o)

        when:
        model.unmodifiable().add(s, p, o2)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().add(stmt) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        def stmt = new SimpleStatement(s, p, o2)
        model.add(s, p, o)

        when:
        model.unmodifiable().add(stmt)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().addAll(model) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o)

        when:
        model.unmodifiable().addAll(model2)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().remove(s, p, o) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        model.add(s, p, o)

        when:
        model.unmodifiable().remove(s, null, null)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().remove(stmt) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def stmt = new SimpleStatement(s, p, o)
        model.add(s, p, o)

        when:
        model.unmodifiable().remove(stmt)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().retainAll(model) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        model.add(s, p, o)
        model.add(s, p, o2)
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o)

        when:
        model.unmodifiable().retainAll(model2)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().clear() throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        model.add(s, p, o)

        when:
        model.unmodifiable().clear()

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().clear(context) throws an UnsupportedOperationException"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        model.add(s, p, o, c1)

        when:
        model.unmodifiable().clear(c1)

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().removeNamespace(prefix) throws an UnsupportedOperationException"() {
        setup:
        def ns = new SimpleNamespace("http://test.com#", "Classname")
        model.setNamespace(ns)

        when:
        model.unmodifiable().removeNamespace("http://test.com#")

        then:
        thrown(UnsupportedOperationException)
    }

    def "unmodifiable().setNamespace(ns) throws an UnsupportedOperationException"() {
        setup:
        def ns = new SimpleNamespace("http://test.com#", "Classname")

        when:
        model.unmodifiable().setNamespace(ns)

        then:
        thrown(UnsupportedOperationException)
    }

    def "retainAll(model) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        def o3 = new SimpleLiteral("Mobi3")
        model.add(s, p, o)
        model.add(s, p, o2)
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o)
        def model3 = new SesameModelWrapper(new LinkedHashModel())
        model3.add(s, p, o3)

        expect:
        model.size() == 2
        model.retainAll(model2)
        model.size() == 1
        !model.retainAll(model2)
        model.size() == 1
        !model.retainAll(model)
        model.size() == 1
        model.retainAll(model3)
        model.size() == 0
    }

    def "removeAll(model) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        def o3 = new SimpleLiteral("Mobi3")
        model.add(s, p, o)
        model.add(s, p, o2)
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o)
        def model3 = new SesameModelWrapper(new LinkedHashModel())
        model3.add(s, p, o3)

        expect:
        model.size() == 2
        model.removeAll(model2)
        model.size() == 1
        !model.removeAll(model2)
        model.size() == 1
        !model.removeAll(model3)
        model.size() == 1
        model.removeAll(model)
        model.size() == 0
    }

    def "contains(object) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        def stmt = new SimpleStatement(s, p, o)
        def stmt2 = new SimpleStatement(s, p, o, c1)
        def stmt3 = new SimpleStatement(s, p, o, c2)
        def stmt4 = new SimpleStatement(s, p, o2)
        model.add(s, p, o)
        model.add(s, p, o, c1)

        expect:
        model.contains(stmt)
        model.contains(stmt2)
        !model.contains(stmt3)
        !model.contains(stmt4)
    }

    def "contains(s, p, o, c) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        model.add(s, p, o)
        model.add(s, p, o, c1)

        expect:
        model.contains(s, p, o)
        model.contains(s, p, o, null)
        model.contains(s, p, o, c1)
        model.contains(null, null, null)
        model.contains(null, null, null, null)
        model.contains(s, null, null)
        model.contains(s, p, null)
        model.contains(null, p, o)
        model.contains(null, null, o)
        !model.contains(s, p, o, c2)
        !model.contains(null, null, null, c2)
        !model.contains(null, null, o2)
        !model.contains(null, null, o2, null)
    }

    def "containsAll(model) returns boolean correctly"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def o2 = new SimpleLiteral("Mobi")
        def c1 = new SimpleIRI("http://test.com/c1")
        def c2 = new SimpleIRI("http://test.com/c2")
        model.add(s, p, o)
        model.add(s, p, o, c1)
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(s, p, o)
        def model3 = new SesameModelWrapper(new LinkedHashModel())
        model3.add(s, p, o)
        model3.add(s, p, o, c1)
        def model4 = new SesameModelWrapper(new LinkedHashModel())
        model4.add(s, p, o)
        model4.add(s, p, o, c1)
        model4.add(s, p, o2, c1)

        expect:
        model.containsAll(model2)
        model.containsAll(model3)
        !model.containsAll(model4)
    }

    def "toArray() returns an Object Array"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        model.add(s, p, o, c1)

        expect:
        model.toArray().length == 1
    }

    def "toArray(Statement[]) returns an Object Array"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def stmt = new SimpleStatement(s, p, o, c1)
        model.add(stmt)
        def stmts = new Statement[1]

        expect:
        model.toArray(stmts).length == 1
        model.toArray(stmts)[0] == stmt
    }

    def "iterator() next() works"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def stmt = new SimpleStatement(s, p, o, c1)
        model.add(stmt)
        def itr = model.iterator()

        expect:
        itr.hasNext()
        itr.next() == stmt
    }

    def "iterator() remove() works"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def stmt = new SimpleStatement(s, p, o, c1)
        model.add(stmt)
        def itr = model.iterator()
        itr.hasNext()
        itr.next()
        itr.remove()

        expect:
        model.size() == 0
    }

    def "size() returns the correct size"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def stmt = new SimpleStatement(s, p, o, c1)
        model.add(stmt)

        expect:
        model.size() == 1
    }

    def "empty() returns the correct size"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def stmt = new SimpleStatement(s, p, o, c1)
        model.add(stmt)
        def model2 = new SesameModelWrapper(new LinkedHashModel())

        expect:
        !model.isEmpty()
        model2.isEmpty()
    }

    def "hashCode() returns the same int"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c1 = new SimpleIRI("http://test.com/c1")
        def stmt = new SimpleStatement(s, p, o, c1)
        model.add(stmt)
        def model2 = new SesameModelWrapper(new LinkedHashModel())
        model2.add(stmt)

        expect:
        model.hashCode() == model2.hashCode()
    }
}
