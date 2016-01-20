package org.matonto.repository.impl.sesame.query

import org.matonto.query.api.BindingSet
import org.openrdf.query.TupleQueryResult
import spock.lang.Specification

class SesameTupleQueryResultSpec extends Specification{
    def "getBindingNames() returns list of the names of a binding"() {
        setup:
        TupleQueryResult sesameTQR = Mock()
        SesameTupleQueryResult tupleQueryResult = new SesameTupleQueryResult(sesameTQR)
        List<String> bindingSetNames = ["test"]


        then:
        bindingSetNames.equals(tupleQueryResult.getBindingNames())
        1 * sesameTQR.getBindingNames() >> bindingSetNames

    }

    def "hasNext() returns true if bindingSet has another value"() {
        setup:
        TupleQueryResult sesameTQR = Mock()
        SesameTupleQueryResult tupleQueryResult = new SesameTupleQueryResult(sesameTQR)

        then:
        tupleQueryResult.hasNext()
        1 * sesameTQR.hasNext() >> true

    }

    def "hasNext() returns false if bindingSet does not have another value"() {
        setup:
        TupleQueryResult sesameTQR = Mock()
        SesameTupleQueryResult tupleQueryResult = new SesameTupleQueryResult(sesameTQR)

        then:
        !tupleQueryResult.hasNext()
        1 * sesameTQR.hasNext() >> false
    }

    def "next() returns next BindingSet result"(){
        setup:
        TupleQueryResult sesameTQR = Mock()
        SesameTupleQueryResult tupleQueryResult = new SesameTupleQueryResult(sesameTQR)
        org.openrdf.query.BindingSet sesBindingSet = Mock()

        when:
        tupleQueryResult.next()

        then:
        noExceptionThrown()
        1 * sesameTQR.next() >> sesBindingSet
    }

    def "remove() does not cause exception when tupleQueryResult has another value"(){
        setup:
        TupleQueryResult sesameTQR = Mock()
        SesameTupleQueryResult tupleQueryResult = new SesameTupleQueryResult(sesameTQR)
        org.openrdf.query.BindingSet sesBindingSet = Mock()

        when:
        tupleQueryResult.remove()

        then:
        noExceptionThrown()
    }

}
