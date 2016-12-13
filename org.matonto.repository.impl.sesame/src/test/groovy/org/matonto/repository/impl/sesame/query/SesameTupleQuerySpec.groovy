package org.matonto.repository.impl.sesame.query

import org.matonto.query.TupleQueryResult
import org.matonto.query.api.TupleQuery
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper
import org.openrdf.repository.sail.SailRepository
import org.openrdf.sail.memory.MemoryStore
import spock.lang.Specification

import static org.junit.Assert.assertFalse
import static org.junit.Assert.assertTrue

class SesameTupleQuerySpec extends Specification {

    def memRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))
    RepositoryConnection conn

    def vf = SimpleValueFactory.getInstance()

    def setup() {
        memRepo.initialize()
        conn = memRepo.getConnection()
    }

    def cleanup() {
        conn.close()
        memRepo.shutDown()
    }

    def "TupleQuery.evaluateAndReturn() returns a TupleQueryResult that is not backed by the RepositoryConnection"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")

        conn.add(s,p,o)

        TupleQuery tupleQuery = conn.prepareTupleQuery("SELECT ?s ?o WHERE { ?s <http://test.com/p> ?o . }")

        TupleQueryResult tqr = tupleQuery.evaluateAndReturn()
        conn.close()

        assertTrue tqr.hasNext()

    }

    def "TupleQuery.evaluate() returns a TupleQueryResult that is backed by the RepositoryConnection"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")

        conn.add(s,p,o)

        TupleQuery tupleQuery = conn.prepareTupleQuery("SELECT ?s ?o WHERE { ?s <http://test.com/p> ?o . }")

        TupleQueryResult tqr = tupleQuery.evaluate()
        conn.close()

        assertFalse tqr.hasNext()
    }
}