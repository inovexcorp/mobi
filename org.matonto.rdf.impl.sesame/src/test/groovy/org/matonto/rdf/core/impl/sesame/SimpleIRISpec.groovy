package org.matonto.rdf.core.impl.sesame

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
            "http://test.com/Class Name",
            "http://te st.com/ClassName",
            "http://te%20st.com/ClassName",
            "ht tp://te st.com/Class Name"
    ]

    @Shared
    def localNames = [
            "ClassName",
            "ClassName",
            "ClassName",
            "ClassName",
            "",
            "Class Name",
            "ClassName",
            "ClassName",
            "Class Name"
    ]

    @Shared
    def namespaces = [
            "http://test.com/Class#",
            "http://test.com/",
            "http://test.com/#",
            "urn:",
            "http://test.com/Class#",
            "http://test.com/",
            "http://te st.com/",
            "http://te%20st.com/",
            "ht tp://te st.com/"
    ]

    @Shared
    def badIris = [
            "http//test.com",
            "",
            "this is not an iri"
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
        "http://te st.com/Class#ClassName" | "http://te%20st.com/Class#ClassName"
        "http://test.com/Class#" | "http://te%20st.com/Class#ClassName"
        "http://test.com/Class" | "http://test.com/"
        "urn:test1" | "urn:test2"
        "urn1:test" | "urn2:test"
    }
}
