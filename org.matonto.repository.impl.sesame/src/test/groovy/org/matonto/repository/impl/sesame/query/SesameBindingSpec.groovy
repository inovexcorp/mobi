package org.matonto.repository.impl.sesame.query

import org.matonto.rdf.core.utils.Values
import org.openrdf.model.IRI
import org.openrdf.model.impl.ValueFactoryImpl
import spock.lang.Specification
import org.matonto.query.api.Binding

class SesameBindingSpec extends Specification {

    def "getName() returns binding name"() {
        setup:
        def sesBinding = Mock(org.openrdf.query.Binding)
        def matBinding = new SesameBinding(sesBinding);

        1 * sesBinding.getName() >> "testName"

        expect:
        matBinding.getName().equals("testName")
    }

    def "getValue() returns binding's value"() {
        setup:
        def sesBinding = Mock(org.openrdf.query.Binding)
        def matBinding = new SesameBinding(sesBinding)
        def testVal =  new ValueFactoryImpl().createIRI("http://testVal.com");

        1 * sesBinding.getValue() >> testVal

        expect:
        matBinding.getValue().equals(Values.matontoIRI(testVal))
    }

}
