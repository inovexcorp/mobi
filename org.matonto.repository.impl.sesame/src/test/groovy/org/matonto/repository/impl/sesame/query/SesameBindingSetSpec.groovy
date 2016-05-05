package org.matonto.repository.impl.sesame.query

import org.openrdf.model.impl.ValueFactoryImpl
import org.openrdf.query.BindingSet
import org.openrdf.query.impl.MapBindingSet
import spock.lang.Specification

class SesameBindingSetSpec extends Specification {

    def "hasBindingSet(String) returns true when binding set exists"() {
        setup:
        def sesBindingSet = Mock(BindingSet)
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)
        1 * sesBindingSet.hasBinding("test") >> true

        expect:
        bindingSet.hasBinding("test");
    }

    def "hasBindingSet(String) returns false when binding set doesn't exists"() {
        setup:
        def sesBindingSet = Mock(BindingSet)
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)
        1 * sesBindingSet.hasBinding("test") >> false

        expect:
        !bindingSet.hasBinding("test");
    }

    def "getBindingNames() returns all binding names" () {
        setup:
        def sesBindingSet = Mock(BindingSet)
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)
        def bindingNames = ["test"] as Set

        1 * sesBindingSet.getBindingNames() >> bindingNames

        expect:
        bindingSet.getBindingNames().equals(bindingNames)

    }

    def "getBinding(String) returns a MatOnto binding with the same name"() {
        setup:
        def sesBindingSet = Mock(BindingSet)
        def matBindingSet = new SesameBindingSet(sesBindingSet)
        def sesBinding = Mock(org.openrdf.query.Binding)
        def matBinding = new SesameBinding(sesBinding)
        def testVal =  new ValueFactoryImpl().createIRI("http://testVal.com");

        2 * sesBindingSet.getBinding("test") >> sesBinding
        2 * sesBinding.getName() >> "testName"
        2 * sesBinding.getValue() >> testVal

        expect:
        matBindingSet.getBinding("test").get().getName().equals(matBinding.getName())
        matBindingSet.getBinding("test").get().getValue().equals(matBinding.getValue())
    }

    def "getBinding(String) returns an empty Optional when binding doesn't exist"() {
        setup:
        def sesBindingSet = new MapBindingSet();
        def matBindingSet = new SesameBindingSet(sesBindingSet)

        expect:
        !matBindingSet.getBinding("test").isPresent()
    }

    def "getValue(String) returns an empty Optional when binding doesn't exist"() {
        setup:
        def sesBindingSet = new MapBindingSet();
        def matBindingSet = new SesameBindingSet(sesBindingSet)

        expect:
        !matBindingSet.getValue("test").isPresent()
    }

    def "size() returns BindingSet size"() {
        setup:
        def sesBindingSet = Mock(BindingSet)
        def bindingSet = new SesameBindingSet(sesBindingSet)

        1 * sesBindingSet.size() >> 1

        expect:
        bindingSet.size() == 1
    }
}
