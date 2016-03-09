package org.matonto.repository.impl.sesame.query

import org.matonto.query.api.BindingSet
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper
import org.openrdf.repository.sail.SailRepository
import org.openrdf.sail.memory.MemoryStore
import spock.lang.Specification

class SesameOperationSpec extends Specification{
    def memRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))
    RepositoryConnection conn

    def vf = SimpleValueFactory.getInstance()

    def setup() {
        memRepo.initialize()
        conn = memRepo.getConnection()
    }

    def "setMaxExecutionTime() and getMaxExceutionTime() provide consistent results" (){
        setup:
        def operation = conn.prepareTupleQuery("SELECT * WHERE {?s ?p ?o}")
        def time = 100

        when:
        operation.setMaxExecutionTime(time)

        then:
        operation.getMaxExecutionTime() == 100
    }

    def "setBindings() adds bindings to the BindingSet"(){
        setup:
        def operation = conn.prepareTupleQuery("SELECT * WHERE {?s ?p ?o}")
        def s = vf.createIRI("http://test.com/s")

        when:
        operation.setBinding("s", s)
        def bindingSet = operation.getBindings()

        then:
        bindingSet.size() == 1
    }

    def "removeBinding() removes a binding from the BindingSet"() {
        setup:
        def operation = conn.prepareTupleQuery("SELECT * WHERE {?s ?p ?o}")
        def s = vf.createIRI("http://test.com/s")
        operation.setBinding("s", s)

        when:
        operation.removeBinding("s")
        def bindingSet = operation.getBindings()

        then:
        bindingSet.size() == 0
    }

    def "clearBindings() removes all bindings"() {
        setup:
        def operation = conn.prepareTupleQuery("SELECT * WHERE {?s ?p ?o}")
        def s = vf.createIRI("http://test.com/s")
        operation.setBinding("s", s)

        when:
        operation.clearBindings()
        BindingSet bindingSet = operation.getBindings()

        then:
        bindingSet.size() == 0
    }

    def "setIncludeInferred() sets getIncludeInferred()"() {
        setup:
        def operation = conn.prepareTupleQuery("SELECT * WHERE {?s ?p ?o}")

        when:
        operation.setIncludeInferred(true)

        then:
        operation.getIncludeInferred()
    }
}
