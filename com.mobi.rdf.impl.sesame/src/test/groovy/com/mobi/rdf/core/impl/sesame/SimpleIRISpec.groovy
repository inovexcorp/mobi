/*-
 * #%L
 * com.mobi.rdf.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import spock.lang.Shared
import spock.lang.Specification

class SimpleIRISpec extends Specification {

    @Shared
    def irisToTest = [
            "http://test.com/Class#ClassName",
            "http://test.com/ClassName",
            "http://test.com/#ClassName",
            "urn:ClassName",
            "http://test.com/Class#",
            "http://te%20st.com/ClassName",
            "http://mobi.com/policies/record/https%3A%2F%2Fmobi.com%2Frecords%2FtestRecord1",
            "http://mobi.com/policy/prop-path(%3Chttp%3A%2F%2Fmobi.com%2Fontologies%2Fpolicy%23relatedResource%3E%2F%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23type%3E)",
            "http://mobi.com/policy/prop-path(%5E%3Chttp%3A%2F%2Ftest.com%2Fpath%3E%2F%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2Ftitle%3E)"
    ]

    @Shared
    def localNames = [
            "ClassName",
            "ClassName",
            "ClassName",
            "ClassName",
            "",
            "ClassName",
            "https%3A%2F%2Fmobi.com%2Frecords%2FtestRecord1",
            "prop-path(%3Chttp%3A%2F%2Fmobi.com%2Fontologies%2Fpolicy%23relatedResource%3E%2F%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23type%3E)",
            "prop-path(%5E%3Chttp%3A%2F%2Ftest.com%2Fpath%3E%2F%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2Ftitle%3E)"
    ]

    @Shared
    def namespaces = [
            "http://test.com/Class#",
            "http://test.com/",
            "http://test.com/#",
            "urn:",
            "http://test.com/Class#",
            "http://te%20st.com/",
            "http://mobi.com/policies/record/",
            "http://mobi.com/policy/",
            "http://mobi.com/policy/"
    ]

    @Shared
    def badIris = [
            "http//test.com",
            "",
            "this is not an iri",
            "urn:test#multiple#fragments",
            "http://test.com/Class Name",
            "http://te st.com/ClassName",
            "ht tp://te st.com/Class Name"
    ]

    def "local name of #iriString is #localName"() {
        setup:
        def iri = new SimpleIRI(iriString)

        expect:
        iri.getLocalName() == localName

        where:
        iriString << irisToTest
        localName << localNames
    }

    def "namespace of #iriString is #namespace"() {
        setup:
        def iri = new SimpleIRI(iriString)

        expect:
        iri.getNamespace() == namespace

        where:
        iriString << irisToTest
        namespace << namespaces
    }

    def "#iriString equals #iriString"() {
        setup:
        def iri1 = new SimpleIRI(iriString)
        def iri2 = new SimpleIRI(iriString)

        expect:
        iri1.equals(iri2)

        where:
        iriString << irisToTest
    }

    def "hashcode of #iriString is hashcode of String representation"() {
        setup:
        def iri = new SimpleIRI(iriString)

        expect:
        iri.hashCode() == iriString.hashCode()

        where:
        iriString << irisToTest
    }

    def "toString of #iriString is #iriString"() {
        setup:
        def iri = new SimpleIRI(iriString)

        expect:
        iri.toString() == iriString

        where:
        iriString << irisToTest
    }

    def "stringValue of #iriString is #iriString"() {
        setup:
        def iri = new SimpleIRI(iriString)

        expect:
        iri.stringValue() == iriString

        where:
        iriString << irisToTest
    }

    def "#badIriString should throw an IllegalArgumentException"() {
        when:
        new SimpleIRI(badIriString)

        then:
        thrown(IllegalArgumentException)

        where:
        badIriString << badIris
    }

    def "#iriString1 does not equal #iriString2"() {
        setup:
        def iri1 = new SimpleIRI(iriString1)
        def iri2 = new SimpleIRI(iriString2)

        expect:
        !iri1.equals(iri2)

        where:
        iriString1 | iriString2
        "http://test.com/Class#ClassName" | "http://test.com/test2"
        "http://test.com/Class#" | "http://te%20st.com/Class#ClassName"
        "http://test.com/Class" | "http://test.com/"
        "urn:test1" | "urn:test2"
        "urn1:test" | "urn2:test"
    }
}
