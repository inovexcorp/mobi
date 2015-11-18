package org.matonto.repository.impl.sesame

import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.openrdf.repository.sail.SailRepository
import org.openrdf.sail.memory.MemoryStore
import spock.lang.IgnoreRest
import spock.lang.Specification

class SesameRepositoryConnectionWrapperSpec extends Specification {

    def memRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))
    def conn

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
}
