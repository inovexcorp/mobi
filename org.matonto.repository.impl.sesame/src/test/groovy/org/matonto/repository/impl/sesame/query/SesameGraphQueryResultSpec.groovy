package org.matonto.repository.impl.sesame.query

import org.matonto.rdf.api.Statement
import org.matonto.rdf.api.ValueFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import spock.lang.Specification

class SesameGraphQueryResultSpec extends Specification {

    def "getNamespaces() returns all namespaces"(){
        org.openrdf.query.GraphQueryResult sesGQR = Mock()
        SesameGraphQueryResult graphQueryResult = new SesameGraphQueryResult(sesGQR)
        Map<String,String> nameSpaces = [Prefix:"Namespace"]

        then:
        graphQueryResult.getNamespaces().equals(nameSpaces)
        1 * sesGQR.getNamespaces() >> nameSpaces
    }

    def "hasNext() returns true if sesGQR has statments"() {
        org.openrdf.query.GraphQueryResult sesGQR = Mock()
        SesameGraphQueryResult graphQueryResult = new SesameGraphQueryResult(sesGQR)

        then:
        graphQueryResult.hasNext()
        1 * sesGQR.hasNext() >> true
    }

    def "next() returns next statment in result"() {
        org.openrdf.query.GraphQueryResult sesGQR = Mock()
        SesameGraphQueryResult graphQueryResult = new SesameGraphQueryResult(sesGQR)
        ValueFactory vf = SimpleValueFactory.getInstance();
        org.openrdf.model.IRI subj = vf.createIRI("http://test.com/sub")
        org.openrdf.model.IRI pred = vf.createIRI("http://test.com/pred")
        org.openrdf.model.IRI obj = vf.createIRI("http://test.com/obj")
        org.openrdf.model.Statement sesStatement = vf.createStatement(subj, pred, obj)
        Statement s = Values.matontoStatement(sesStatement)

        then:
        s = graphQueryResult.next()
        1 * sesGQR.next() >> sesStatement

    }

}
