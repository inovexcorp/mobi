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
package com.mobi.rdf.core.impl.sesame

import org.openrdf.model.vocabulary.RDF
import org.openrdf.model.vocabulary.XMLSchema
import spock.lang.Specification

import java.time.OffsetDateTime

import static groovyx.gpars.GParsPool.*

class SimpleValueFactorySpec extends Specification {

    def VF = SimpleValueFactory.getInstance()

    def "getInstance implements singleton works"() {
        expect:
        SimpleValueFactory.getInstance() == SimpleValueFactory.getInstance()
    }

    def "createBNode() returns unique BNodes"() {
        expect:
        VF.createBNode() != VF.createBNode()
    }

    def "createBNode() returns BNodes that start with matonto prefix"() {
        expect:
        VF.createBNode().stringValue().startsWith("matonto-bnode-")
    }

    def "createBNode() returns unique BNodes with two threads"() {
        setup:
        def results = []
        withPool(2) {
            def code = { VF.createBNode() }
            results << code.callAsync()
            results << code.callAsync()
        }
        results = results*.get()

        expect:
        results.size() == 2
        results[0] != results[1]
    }

    def "createBNode() returns BNodes with IDs"() {
        expect:
        VF.createBNode().getID().length() > 0
    }

    def "createBNode(String id).getID is id"() {
        expect:
        VF.createBNode("_:matonto/MatOnto").getID() == "_:matonto/MatOnto"
    }

    def "createIRI(iri) creates the correct IRI"() {
        given:
        def iri = VF.createIRI("http://test.com/1")

        expect:
        iri.getNamespace() == "http://test.com/"
        iri.getLocalName() == "1"
    }

    def "createIRI(namespace, localName) creates the correct IRI"() {
        given:
        def iri = VF.createIRI("http://test.com/", "1")

        expect:
        iri.getNamespace() == "http://test.com/"
        iri.getLocalName() == "1"
    }

    def "createStatement(s, p, o) creates the correct statement"() {
        setup:
        def stmt = VF.createStatement(s, p, o)

        expect:
        stmt.getSubject() == s
        stmt.getPredicate() == p
        stmt.getObject() == o

        where:
        s | p | o
        new SimpleIRI("http://test.com/s") | new SimpleIRI("http://test.com/p") | new SimpleIRI("http://test.com/o")
        new SimpleIRI("http://test.com/s") | new SimpleIRI("http://test.com/p") | new SimpleLiteral("MatOnto")
        new SimpleBNode("_:matonto/1") | new SimpleIRI("http://test.com/p") | new SimpleLiteral("MatOnto")
        new SimpleIRI("http://test.com/s") | new SimpleIRI("http://test.com/p") | new SimpleBNode("_:matonto/1")
    }

    def "createStatement(s, p, o, null) creates the correct statement"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def stmt = VF.createStatement(s, p, o, null)

        expect:
        stmt.getSubject() == s
        stmt.getPredicate() == p
        stmt.getObject() == o
        stmt.getContext() == Optional.empty()
    }

    def "createStatement(s, p, o, c) creates the correct statement"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def c = new SimpleIRI("http://test.com/c")
        def stmt = VF.createStatement(s, p, o, c)

        expect:
        stmt.getSubject() == s
        stmt.getPredicate() == p
        stmt.getObject() == o
        stmt.getContext().get() == c
    }

    def "createLiteral(string) creates the correct literal"() {
        given:
        def literal = VF.createLiteral("MatOnto")

        expect:
        literal.getLabel() == "MatOnto"
        literal.getDatatype().stringValue() == XMLSchema.STRING.stringValue()
        literal.getLanguage() == Optional.empty()
    }

    def "createLiteral(string, datatype) creates the correct literal"() {
        given:
        def literal = VF.createLiteral("true", VF.createIRI(XMLSchema.BOOLEAN.stringValue()))

        expect:
        literal.getLabel() == "true"
        literal.getDatatype().stringValue() == XMLSchema.BOOLEAN.stringValue()
        literal.getLanguage() == Optional.empty()
    }

    def "createLiteral(string, language) creates the correct literal"() {
        given:
        def literal = VF.createLiteral("true", "en")

        expect:
        literal.getLabel() == "true"
        literal.getDatatype().stringValue() == RDF.LANGSTRING.stringValue()
        literal.getLanguage().get() == "en"
    }

    def "createLiteral(boolean) creates the correct literal"() {
        given:
        def literal = VF.createLiteral(value)

        expect:
        literal.getLabel() == valueString
        literal.getDatatype().stringValue() == XMLSchema.BOOLEAN.stringValue()
        literal.booleanValue() == value

        where:
        valueString | value
        "true" | true
        "false" | false
    }

    def "createLiteral(byte) creates the correct literal"() {
        given:
        def literal = VF.createLiteral((byte) 127)

        expect:
        literal.getLabel() == "127"
        literal.getDatatype().stringValue() == XMLSchema.BYTE.stringValue()
        literal.byteValue() == (byte) 127
    }

    def "createLiteral(date) creates the correct literal"() {
        given:
        def literal = VF.createLiteral(OffsetDateTime.parse(dateTimeString))

        expect:
        literal.getLabel() == dateTimeString
        literal.getDatatype().stringValue() == XMLSchema.DATETIME.stringValue()
        literal.dateTimeValue() == OffsetDateTime.parse(dateTimeString)

        where:
        dateTimeString << ["2015-01-01T00:00:00Z", "-2015-01-01T00:00:00Z"]
    }

    def "createLiteral(double) creates the correct literal"() {
        given:
        def literal = VF.createLiteral(42.42d)

        expect:
        literal.getLabel() == "42.42"
        literal.getDatatype().stringValue() == XMLSchema.DOUBLE.stringValue()
        literal.doubleValue() == 42.42d
    }

    def "createLiteral(float) creates the correct literal"() {
        given:
        def literal = VF.createLiteral(42.42f)

        expect:
        literal.getLabel() == "42.42"
        literal.getDatatype().stringValue() == XMLSchema.FLOAT.stringValue()
        literal.floatValue() == 42.42f
    }

    def "createLiteral(int) creates the correct literal"() {
        given:
        def literal = VF.createLiteral(42)

        expect:
        literal.getLabel() == "42"
        literal.getDatatype().stringValue() == XMLSchema.INT.stringValue()
        literal.intValue() == 42
    }

    def "createLiteral(long) creates the correct literal"() {
        given:
        def literal = VF.createLiteral(42l)

        expect:
        literal.getLabel() == "42"
        literal.getDatatype().stringValue() == XMLSchema.LONG.stringValue()
        literal.longValue() == 42l
    }

    def "createLiteral(short) creates the correct literal"() {
        given:
        def literal = VF.createLiteral((short) 42)

        expect:
        literal.getLabel() == "42"
        literal.getDatatype().stringValue() == XMLSchema.SHORT.stringValue()
        literal.shortValue() == (short) 42
    }

    def "createNamespace(prefix, name) creates the correct namespace"() {
        given:
        def ns = VF.createNamespace("http://test.com#", "class")

        expect:
        ns.getPrefix() == "http://test.com#"
        ns.getName() == "class"
    }
}
