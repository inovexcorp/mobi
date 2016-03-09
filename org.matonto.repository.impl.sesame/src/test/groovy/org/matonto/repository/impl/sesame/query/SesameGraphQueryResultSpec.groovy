package org.matonto.repository.impl.sesame.query

import org.matonto.rdf.core.utils.Values
import org.openrdf.model.impl.SimpleValueFactory
import org.openrdf.query.GraphQueryResult
import spock.lang.Specification

class SesameGraphQueryResultSpec extends Specification {

    def "getNamespaces() returns all namespaces"(){
        setup:
        def sesGQR = Mock(GraphQueryResult)
        def graphQueryResult = new SesameGraphQueryResult(sesGQR)
        Map<String,String> nameSpaces = [Prefix:"Namespace"]

        1 * sesGQR.getNamespaces() >> nameSpaces

        expect:
        graphQueryResult.getNamespaces().equals(nameSpaces)
    }

    def "hasNext() returns true if sesGQR has statements"() {
        setup:
        def sesGQR = Mock(GraphQueryResult)
        def graphQueryResult = new SesameGraphQueryResult(sesGQR)

        1 * sesGQR.hasNext() >> true

        expect:
        graphQueryResult.hasNext()
    }

    def "next() returns next statement in result"() {
        setup:
        def sesGQR = Mock(GraphQueryResult)
        def graphQueryResult = new SesameGraphQueryResult(sesGQR)
        def vf = SimpleValueFactory.getInstance();
        def subj = vf.createIRI("http://test.com/sub")
        def pred = vf.createIRI("http://test.com/pred")
        def obj = vf.createIRI("http://test.com/obj")
        def sesStatement = vf.createStatement(subj, pred, obj)
        def s = Values.matontoStatement(sesStatement)

        1 * sesGQR.next() >> sesStatement

        expect:
        s.equals(graphQueryResult.next())
    }

}
