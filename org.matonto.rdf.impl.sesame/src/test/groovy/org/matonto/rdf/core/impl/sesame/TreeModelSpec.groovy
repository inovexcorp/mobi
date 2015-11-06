package org.matonto.rdf.core.impl.sesame

import spock.lang.Specification

class TreeModelSpec extends Specification {

    def "default constructor"() {
        expect:
        new TreeModel() instanceof TreeModel
    }

    def "TreeModel(Model)"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def model2 = new SesameModelWrapper(new org.openrdf.model.impl.LinkedHashModel())
        model2.add(s, p, o)
        def model = new TreeModel(model2)

        expect:
        model.size() == 1
    }

    def "TreeModel(Collection)"() {
        setup:
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def collection = [new SimpleStatement(s, p, o)]
        def model = new TreeModel(collection)

        expect:
        model.size() == 1
    }

    def "TreeMode(Namespaces)"() {
        setup:
        def ns = [new SimpleNamespace("http://test.com#", "Classname")] as Set
        def model = new TreeModel(ns)

        expect:
        model.getNamespace("http://test.com#").get() == ns[0]
        model.getNamespaces() == ns
    }

    def "TreeMode(Namespaces, Collection)"() {
        setup:
        def ns = [new SimpleNamespace("http://test.com#", "Classname")] as Set
        def s = new SimpleIRI("http://test.com/s")
        def p = new SimpleIRI("http://test.com/p")
        def o = new SimpleIRI("http://test.com/o")
        def collection = [new SimpleStatement(s, p, o)]
        def model = new TreeModel(ns, collection)

        expect:
        model.getNamespace("http://test.com#").get() == ns[0]
        model.getNamespaces() == ns
        model.size() == 1
    }
}
