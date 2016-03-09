package org.matonto.repository.impl.sesame.query

import org.openrdf.query.BindingSet
import org.openrdf.query.TupleQueryResult
import spock.lang.Specification

class SesameTupleQueryResultSpec extends Specification{
    def "getBindingNames() returns list of the names of a binding"() {
        setup:
        def sesameTQR = Mock(TupleQueryResult)
        def tupleQueryResult = new SesameTupleQueryResult(sesameTQR)
        List<String> bindingSetNames = ["test"]

        1 * sesameTQR.getBindingNames() >> bindingSetNames

        expect:
        bindingSetNames.equals(tupleQueryResult.getBindingNames())
    }

    def "hasNext() returns true if bindingSet has another value"() {
        setup:
        def sesameTQR = Mock(TupleQueryResult)
        def tupleQueryResult = new SesameTupleQueryResult(sesameTQR)

        1 * sesameTQR.hasNext() >> true

        expect:
        tupleQueryResult.hasNext()
    }

    def "hasNext() returns false if bindingSet does not have another value"() {
        setup:
        def sesameTQR = Mock(TupleQueryResult)
        def tupleQueryResult = new SesameTupleQueryResult(sesameTQR)

        1 * sesameTQR.hasNext() >> false

        expect:
        !tupleQueryResult.hasNext()
    }

    def "next() returns next BindingSet result"() {
        setup:
        def sesameTQR = Mock(TupleQueryResult)
        def tupleQueryResult = new SesameTupleQueryResult(sesameTQR)
        def sesBindingSet = Mock(BindingSet)

        when:
        tupleQueryResult.next()

        then:
        1 * sesameTQR.next() >> sesBindingSet
        noExceptionThrown()
    }

    def "remove() does not cause exception when tupleQueryResult has another value"() {
        setup:
        def sesameTQR = Mock(TupleQueryResult)
        def tupleQueryResult = new SesameTupleQueryResult(sesameTQR)

        when:
        tupleQueryResult.remove()

        then:
        noExceptionThrown()
    }
}
