package org.matonto.repository.impl.sesame.query

import org.openrdf.query.TupleQueryResult
import spock.lang.Specification

class SesameTupleQueryResultSpec extends Specification{
    def "getBindingNames() returns list of the names of a binding"() {
        setup:
        TupleQueryResult sesameTQR = Mock()
        SesameTupleQueryResult tupleQueryResult = new SesameTupleQueryResult(sesameTQR)
        List<String> bindingSetNames = ["test"]

        1 * sesameTQR.getBindingNames() >> bindingSetNames

        assert bindingSetNames.equals(tupleQueryResult.getBindingNames())
    }

    def "hasNext() returns true if bindingSet has another value"() {
        setup:
        TupleQueryResult sesameTQR = Mock()
        SesameTupleQueryResult tupleQueryResult = new SesameTupleQueryResult(sesameTQR)

        1 * sesameTQR.hasNext() >> true

        assert tupleQueryResult.hasNext()
    }

    def "hasNext() returns false if bindingSet does not have another value"() {
        setup:
        TupleQueryResult sesameTQR = Mock()
        SesameTupleQueryResult tupleQueryResult = new SesameTupleQueryResult(sesameTQR)

        1 * sesameTQR.hasNext() >> false

        assert !tupleQueryResult.hasNext()
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
