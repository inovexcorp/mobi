package org.matonto.repository.impl.sesame.query

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


}
