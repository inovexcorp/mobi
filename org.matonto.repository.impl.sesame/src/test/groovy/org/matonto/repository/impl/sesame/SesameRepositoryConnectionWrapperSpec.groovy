package org.matonto.repository.impl.sesame

import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.impl.sesame.utils.RepositoryResults
import org.openrdf.repository.sail.SailRepository
import org.openrdf.sail.memory.MemoryStore
import spock.lang.Specification

class SesameRepositoryConnectionWrapperSpec extends Specification {

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

    def "add(s, p, o) does not throw an exception"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")

        when:
        conn.add(s, p, o)

        then:
        notThrown(Exception)
    }

    def "add(s, p, o) increments the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.add(s, p, o)

        expect:
        conn.size() == 1
    }

    def "add(s, p, o, c) increments the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def c = vf.createIRI("http://test.com/c")
        conn.add(s, p, o, c)

        expect:
        conn.size() == 1
    }

    def "add() increases the size of the repository with and without context"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def c = vf.createIRI("http://test.com/c")
        conn.add(s, p, o)
        conn.add(s, p, o, c)

        expect:
        conn.size() == 2
    }

    def "size() on empty repository returns 0"() {
        expect:
        conn.size() == 0
    }

    def "size(context) on empty repository returns 0"() {
        setup:
        def c = vf.createIRI("http://test.com/c")

        expect:
        conn.size(c) == 0
    }

    def "size(context) on non-empty repository returns 0"() {
        setup:
        def c = vf.createIRI("http://test.com/c")
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.add(s, p, o)

        expect:
        conn.size(c) == 0
        conn.size() == 1
    }

    def "size(context) on non-empty repository with context returns 1"() {
        setup:
        def c = vf.createIRI("http://test.com/c")
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.add(s, p, o, c)

        expect:
        conn.size(c) == 1
    }

    def "clear() works for an empty repo"() {
        setup:
        conn.clear()

        expect:
        conn.size() == 0
    }

    def "clear(c) works for an empty repo"() {
        setup:
        def c = vf.createIRI("http://test.com/c")
        conn.clear(c)

        expect:
        conn.size() == 0
    }

    def "clear() works for a non-empty repo"() {
        setup:
        def c = vf.createIRI("http://test.com/c")
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.add(s, p, o, c)
        conn.clear()

        expect:
        conn.size() == 0
    }

    def "clear(c) works for a non-empty repo"() {
        setup:
        def c = vf.createIRI("http://test.com/c")
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.add(s, p, o, c)
        conn.clear(c)

        expect:
        conn.size() == 0
    }

    def "clear(c) does not clear other contexts"() {
        setup:
        def c = vf.createIRI("http://test.com/c")
        def c2 = vf.createIRI("http://test.com/c2")
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.add(s, p, o)
        conn.add(s, p, o, c)
        conn.add(s, p, o, c2)
        conn.clear(c)

        expect:
        conn.size() == 2
        !conn.getStatements(s, p, o, c).hasNext()
    }

    def "getStatements(s, p, o) on empty repo returns empty iterator"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")

        expect:
        !conn.getStatements(s, p, o).hasNext()
    }

    def "getStatements(s, p, o, c) on empty repo returns empty iterator"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def c = vf.createIRI("http://test.com/c")

        expect:
        !conn.getStatements(s, p, o, c).hasNext()
    }

    def "getStatements(s, p, o, c) returns correctly"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def s2 = vf.createIRI("http://test.com/s2")
        def p = vf.createIRI("http://test.com/p")
        def p2 = vf.createIRI("http://test.com/p2")
        def o = vf.createIRI("http://test.com/o")
        def o2 = vf.createIRI("http://test.com/o2")
        def c = vf.createIRI("http://test.com/c")
        def c2 = vf.createIRI("http://test.com/c2")

        conn.add(s, p, o)
        conn.add(s, p, o, c)
        conn.add(s2, p2, o2)
        conn.add(s2, p2, o2, c2)

        def factory = new LinkedHashModelFactory()
        def result1 = RepositoryResults.asModel(conn.getStatements(s, p, o), factory)
        def result2 = RepositoryResults.asModel(conn.getStatements(s, p, o, c), factory)
        def result3 = RepositoryResults.asModel(conn.getStatements(s, null, null), factory)
        def result4 = RepositoryResults.asModel(conn.getStatements(null, null, null), factory)
        def result5 = RepositoryResults.asModel(conn.getStatements(s, null, null, c), factory)

        expect:
        result1.size() == 2
        result2.size() == 1
        result3.size() == 2
        result4.size() == 4
        result5.size() == 1
    }
}
