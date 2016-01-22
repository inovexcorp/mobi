package org.matonto.repository.impl.sesame.query

import org.openrdf.query.BindingSet
import spock.lang.Specification

class SesameBindingSetSpec extends Specification{

    def "hasBindingSet(String) returns true when binding set exists"() {

        setup:
        BindingSet sesBindingSet = Mock()
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)

        then:
        bindingSet.hasBinding("test");
        1 * sesBindingSet.hasBinding("test") >> true

    }

    def "hasBindingSet(String) returns false when binding set doesn't exists"() {
        setup:
        BindingSet sesBindingSet = Mock()
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)

        then:
        !bindingSet.hasBinding("test");
        1 * sesBindingSet.hasBinding("test") >> false
    }

    def "getBindingNames() returns all binding names" () {
        setup:
        BindingSet sesBindingSet = Mock()
        SesameBindingSet bindingSet = new SesameBindingSet(sesBindingSet)
        Set<String> bindingNames = ["test"]

        then:
        bindingSet.getBindingNames().equals(bindingNames)
        1 * sesBindingSet >> bindingNames
    }


}
