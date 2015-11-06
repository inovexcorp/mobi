package org.matonto.rdf.core.impl.sesame

import spock.lang.Shared
import spock.lang.Specification

class SimpleNamespaceSpec extends Specification {

    @Shared
    def prefixes = [
            "http://test.com/",
            "http://test.com#",
            "http://test.com/",
            "",
            ""
    ]

    @Shared
    def names = [
            "Class",
            "Class",
            "",
            "test",
            ""
    ]

    def "prefix #prefix is #prefix"() {
        setup:
        def ns = new SimpleNamespace(prefix, name)

        expect:
        ns.getPrefix() == prefix

        where:
        prefix << prefixes
        name << names
    }

    def "name #name is #name"() {
        setup:
        def ns = new SimpleNamespace(prefix, name)

        expect:
        ns.getName() == name

        where:
        prefix << prefixes
        name << names
    }

    def "#namespace1 equals #namespace1"() {
        setup:
        def ns1 = new SimpleNamespace(prefix, name)
        def ns2 = new SimpleNamespace(prefix, name)

        expect:
        ns1.equals(ns2)

        where:
        prefix << prefixes
        name << names
    }

    def "#namespace1 does not equal #namespace2"() {
        setup:
        def ns1 = new SimpleNamespace(prefix1, name1)
        def ns2 = new SimpleNamespace(prefix2, name2)

        expect:
        !ns1.equals(ns2)

        where:
        namespace1 | prefix1 | name1 | namespace2 | prefix2 | name2
        "http://test.com/test" | "http://test.com/" | "test" | "http://test.com/test1" | "http://test.com/" | "test1"
        "http://test.com/test" | "http://test.com/" | "test" | "http://test1.com/test" | "http://test1.com/" | "test"
        "test" | "" | "test" | "test1" | "" | "test1"
        "http://test.com/" | "http://test.com/" | "" | "http://test1.com/" | "http://test1.com/" | ""
    }

    def "hashCode of #namespace1 equals #namespace1"() {
        setup:
        def ns1 = new SimpleNamespace(prefix, name)
        def ns2 = new SimpleNamespace(prefix, name)

        expect:
        ns1.hashCode() == ns2.hashCode()

        where:
        prefix << prefixes
        name << names
    }
}
