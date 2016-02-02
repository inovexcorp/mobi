package org.matonto.repository.impl.sesame.query

import org.matonto.query.api.Binding
import org.matonto.rdf.core.utils.Values
import org.openrdf.model.IRI
import org.openrdf.model.ValueFactory
import org.openrdf.model.impl.ValueFactoryImpl
import org.openrdf.query.BindingSet
import spock.lang.Specification

class SesameBindingSetSpec extends Specification{

    def "hasBindingSet(String) returns true when binding set exists"() {

        setup:
        BindingSet sesBindingSet = Mock()
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)

        1 * sesBindingSet.hasBinding("test") >> true

        assert bindingSet.hasBinding("test");


    }

    def "hasBindingSet(String) returns false when binding set doesn't exists"() {
        setup:
        BindingSet sesBindingSet = Mock()
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)

        1 * sesBindingSet.hasBinding("test") >> false

        assert !bindingSet.hasBinding("test");
    }

    def "getBindingNames() returns all binding names" () {
        setup:
        BindingSet sesBindingSet = Mock()
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)
        Set<String> bindingNames = ["test"]

        1 * sesBindingSet.getBindingNames() >> bindingNames

        assert bindingSet.getBindingNames().equals(bindingNames)

    }

    def "getBinding(String) returns a MatOnto binding with the same name"() {
        setup:
        BindingSet sesBindingSet = Mock()
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)
        org.openrdf.query.Binding sesBinding = Mock()
        Binding matBinding = new SesameBinding(sesBinding)
        IRI testVal =  new ValueFactoryImpl().createIRI("http://testVal.com");

        2 * sesBindingSet.getBinding("test") >> sesBinding
        2 * sesBinding.getName() >> "testName"
        2 * sesBinding.getValue() >> testVal

        assert bindingSet.getBinding("test").get().getName().equals(matBinding.getName())
        assert Values.matontoValue(bindingSet.getBinding("test").get().getValue()).equals(matBinding.getValue())
    }

    def "size() returns BindingSet size" (){
        setup:
        BindingSet sesBindingSet = Mock()
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)

        1 * sesBindingSet.size() >> 1

        assert bindingSet.size() == 1
    }


}
