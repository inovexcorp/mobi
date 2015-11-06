package org.matonto.rdf.core.impl.sesame

import spock.lang.Shared
import spock.lang.Specification

class SimpleBNodeSpec extends Specification {

    @Shared
    def bnodes = [
            "_:matonto/bnode/",
            "urn:matonto/bnode/",
            "_:matonto/bno de/",
            "http://matonto/bnode/",
            "http://matonto/bnode#Name"
    ]

    def "id of #bnodeString is #bnodeString"() {
        setup:
        def bnode = new SimpleBNode(bnodeString)

        expect:
        bnode.getID() == bnodeString

        where:
        bnodeString << bnodes
    }

    def "hashcode of #bnodeString is hashcode of String representation"() {
        setup:
        def bnode = new SimpleBNode(bnodeString)

        expect:
        bnode.hashCode() == bnodeString.hashCode()

        where:
        bnodeString << bnodes
    }

    def "#bnodeString equals #bnodeString"() {
        setup:
        def bnode1 = new SimpleBNode(bnodeString)
        def bnode2 = new SimpleBNode(bnodeString)

        expect:
        bnode1.equals(bnode2)

        where:
        bnodeString << bnodes
    }

    def "toString of #bnodeString is #bnodeString"() {
        setup:
        def bnode = new SimpleBNode(bnodeString)

        expect:
        bnode.toString() == bnodeString

        where:
        bnodeString << bnodes
    }

    def "stringValue of #bnodeString is #bnodeString"() {
        setup:
        def bnode = new SimpleBNode(bnodeString)

        expect:
        bnode.stringValue() == bnodeString

        where:
        bnodeString << bnodes
    }

    def "#bnodeString1 does not equal #bnodeString2"() {
        setup:
        def bnode1 = new SimpleBNode(bnodeString1)
        def bnode2 = new SimpleBNode(bnodeString2)

        expect:
        !bnode1.equals(bnode2)

        where:
        bnodeString1 | bnodeString2
        "_:matonto/bnode/" | "urn:matonto/bnode/"
        "_:matonto/bn ode/" | "urn:matonto/bnode/"
    }
}
