/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
package com.mobi.repository.impl.sesame.query

import com.mobi.query.api.BindingSet
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory
import com.mobi.repository.api.RepositoryConnection
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper
import org.eclipse.rdf4j.repository.sail.SailRepository
import org.eclipse.rdf4j.sail.memory.MemoryStore
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
