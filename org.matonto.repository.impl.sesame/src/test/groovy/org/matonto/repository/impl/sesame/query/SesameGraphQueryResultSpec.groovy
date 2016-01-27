package org.matonto.repository.impl.sesame.query

import org.matonto.rdf.api.Statement
import org.matonto.rdf.core.utils.Values
import org.openrdf.model.ValueFactory
import org.openrdf.model.impl.SimpleValueFactory
import spock.lang.Specification

class SesameGraphQueryResultSpec extends Specification {

    def "getNamespaces() returns all namespaces"(){
        org.openrdf.query.GraphQueryResult sesGQR = Mock()
        SesameGraphQueryResult graphQueryResult = new SesameGraphQueryResult(sesGQR)
        Map<String,String> nameSpaces = [Prefix:"Namespace"]

        1 * sesGQR.getNamespaces() >> nameSpaces

        assert graphQueryResult.getNamespaces().equals(nameSpaces)
    }

    def "hasNext() returns true if sesGQR has statments"() {
        org.openrdf.query.GraphQueryResult sesGQR = Mock()
        SesameGraphQueryResult graphQueryResult = new SesameGraphQueryResult(sesGQR)

        1 * sesGQR.hasNext() >> true

        assert graphQueryResult.hasNext()
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

        1 * sesGQR.next() >> sesStatement

        assert s.equals(graphQueryResult.next())


    }

}
