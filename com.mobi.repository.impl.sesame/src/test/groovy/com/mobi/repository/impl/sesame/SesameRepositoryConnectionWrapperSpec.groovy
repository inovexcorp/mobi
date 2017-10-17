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
package com.mobi.repository.impl.sesame

import com.mobi.query.GraphQueryResult
import com.mobi.query.TupleQueryResult
import com.mobi.query.api.Binding
import com.mobi.query.api.BindingSet
import com.mobi.query.api.GraphQuery
import com.mobi.query.api.TupleQuery
import com.mobi.query.api.Update
import com.mobi.query.exception.MalformedQueryException
import com.mobi.rdf.api.Statement
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory
import com.mobi.persistence.utils.RepositoryResults
import com.mobi.query.GraphQueryResult
import com.mobi.query.TupleQueryResult
import com.mobi.query.api.Binding
import com.mobi.query.api.BindingSet
import com.mobi.query.api.BooleanQuery
import com.mobi.query.api.GraphQuery
import com.mobi.query.api.TupleQuery
import com.mobi.query.api.Update
import com.mobi.query.exception.MalformedQueryException
import com.mobi.rdf.api.Statement
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory
import com.mobi.repository.api.RepositoryConnection
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

    def "add(s, p, o[, c]) increases the size of the repository with and without context"() {
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

    def "add(stmt) increments the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def c = vf.createIRI("http://test.com/c")
        conn.add(vf.createStatement(s, p, o))
        conn.add(vf.createStatement(s, p, o, c))

        expect:
        conn.size() == 2
    }

    def "add(stmt, c) increments the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def o2 = vf.createIRI("http://test.com/o2")
        def c = vf.createIRI("http://test.com/c")
        def c2 = vf.createIRI("http://test.com/c2")
        conn.add(vf.createStatement(s, p, o), c2)
        conn.add(vf.createStatement(s, p, o, c), c2)
        conn.add(vf.createStatement(s, p, o2, c), c2)

        def factory = LinkedHashModelFactory.getInstance()
        def results = RepositoryResults.asModel(conn.getStatements(null, null, null, c2), factory)

        expect:
        conn.size() == 2
        results.size() == 2
    }

    def "add(model) increments the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def c = vf.createIRI("http://test.com/c")

        def factory = LinkedHashModelFactory.getInstance()
        def model = factory.createModel()
        model.add(s, p, o)
        model.add(s, p, o, c)

        conn.add(model)

        expect:
        conn.size() == 2
    }

    def "add(model, c) increments the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def o2 = vf.createIRI("http://test.com/o2")
        def c = vf.createIRI("http://test.com/c")
        def c2 = vf.createIRI("http://test.com/c2")

        def factory = LinkedHashModelFactory.getInstance()
        def model = factory.createModel()
        model.add(s, p, o)
        model.add(s, p, o, c)
        model.add(s, p, o2)

        conn.add(model, c2)

        def results = RepositoryResults.asModel(conn.getStatements(null, null, null, c2), factory)

        expect:
        conn.size() == 2
        results.size() == 2
    }

    def "remove(s, p, o) does not throw an exception"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.add(s, p, o)

        when:
        conn.remove(s, p, o)

        then:
        notThrown(Exception)
    }

    def "remove(s, p, o) decrements the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.add(s, p, o)
        conn.remove(s, p, o)

        expect:
        conn.size() == 0
    }

    def "remove(s, p, o, c) decrements the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def c = vf.createIRI("http://test.com/c")
        conn.add(s, p, o, c)
        conn.remove(s, p, o, c)

        expect:
        conn.size() == 0
    }

    def "remove(s, p, o[, c]) decreases the size of the repository with and without context"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def c = vf.createIRI("http://test.com/c")
        conn.add(s, p, o)
        conn.add(s, p, o, c)
        conn.remove(s, p, o)
        conn.remove(s, p, o, c)

        expect:
        conn.size() == 0
    }

    def "remove(stmt) decrements the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def c = vf.createIRI("http://test.com/c")
        conn.add(vf.createStatement(s, p, o))
        conn.add(vf.createStatement(s, p, o, c))
        conn.remove(vf.createStatement(s, p, o))
        conn.remove(vf.createStatement(s, p, o, c))

        expect:
        conn.size() == 0
    }

    def "remove(stmt, c) decrements the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def o2 = vf.createIRI("http://test.com/o2")
        def c = vf.createIRI("http://test.com/c")
        def c2 = vf.createIRI("http://test.com/c2")
        conn.add(vf.createStatement(s, p, o), c2)
        conn.add(vf.createStatement(s, p, o, c), c2)
        conn.add(vf.createStatement(s, p, o2, c), c2)
        conn.remove(vf.createStatement(s, p, o), c2)
        conn.remove(vf.createStatement(s, p, o, c), c2)
        conn.remove(vf.createStatement(s, p, o2, c), c2)

        def factory = LinkedHashModelFactory.getInstance()
        def results = RepositoryResults.asModel(conn.getStatements(null, null, null, c2), factory)

        expect:
        conn.size() == 0
        results.size() == 0
    }

    def "remove(model) decrements the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def c = vf.createIRI("http://test.com/c")

        def factory = LinkedHashModelFactory.getInstance()
        def model = factory.createModel()
        model.add(s, p, o)
        model.add(s, p, o, c)

        conn.add(model)
        conn.remove(model)

        expect:
        conn.size() == 0
    }

    def "remove(model, c) decrements the size of the repository"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def o2 = vf.createIRI("http://test.com/o2")
        def c = vf.createIRI("http://test.com/c")
        def c2 = vf.createIRI("http://test.com/c2")

        def factory = LinkedHashModelFactory.getInstance()
        def model = factory.createModel()
        model.add(s, p, o)
        model.add(s, p, o, c)
        model.add(s, p, o2)

        conn.add(model, c2)
        conn.remove(model, c2)

        def results = RepositoryResults.asModel(conn.getStatements(null, null, null, c2), factory)

        expect:
        conn.size() == 0
        results.size() == 0
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
        def c3 = vf.createBNode()

        conn.add(s, p, o)
        conn.add(s, p, o, c)
        conn.add(s2, p2, o2)
        conn.add(s2, p2, o2, c2)
        conn.add(s2, p2, o2, c3)

        def factory = LinkedHashModelFactory.getInstance()
        def result1 = RepositoryResults.asModel(conn.getStatements(s, p, o), factory)
        def result2 = RepositoryResults.asModel(conn.getStatements(s, p, o, c), factory)
        def result3 = RepositoryResults.asModel(conn.getStatements(s, null, null), factory)
        def result4 = RepositoryResults.asModel(conn.getStatements(null, null, null), factory)
        def result5 = RepositoryResults.asModel(conn.getStatements(s, null, null, c), factory)
        def result6 = RepositoryResults.asModel(conn.getStatements(null, null, null, c), factory)
        def result7 = RepositoryResults.asModel(conn.getStatements(null, null, null, c3), factory)

        expect:
        result1.size() == 2
        result2.size() == 1
        result3.size() == 2
        result4.size() == 5
        result5.size() == 1
        result6.size() == 1
        result7.size() == 1
    }

    def "contains(Resource, IRI, Value, Resource) returns correctly"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def s2 = vf.createIRI("http://test.com/s2")
        def p = vf.createIRI("http://test.com/p")
        def p2 = vf.createIRI("http://test.com/p2")
        def o = vf.createIRI("http://test.com/o")
        def o2 = vf.createIRI("http://test.com/o2")
        def c = vf.createIRI("http://test.com/c")
        def c2 = vf.createIRI("http://test.com/c2")
        def c3 = vf.createBNode()
        conn.add(s, p, o)
        conn.add(s, p, o, c)
        conn.add(s2, p2, o2)
        conn.add(s2, p2, o2, c2)
        conn.add(s2, p2, o2, c3)

        expect:
        conn.contains(s, p, o)
        conn.contains(s, p, o, c)
        !conn.contains(s, p2, o)
        !conn.contains(s, p, o, c2)
        conn.contains(s2, p2, o2)
        conn.contains(s2, p2, o2, c2, c3)
    }

    def "containsContext(Resource) returns correctly"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        def c = vf.createIRI("http://test.com/c")
        conn.add(s, p, o, c)

        expect:
        conn.containsContext(c)
    }

    def "containsContext(Resource) returns correctly when context doesn't exist"() {
        setup:
        def c = vf.createIRI("http://test.com/c")

        expect:
        !conn.containsContext(c)
    }
    
    def "getContextIDs() returns correctly for empty repo"() {
        expect:
        !conn.getContextIDs().hasNext()
    }

    def "getContextIDs() returns correctly for non-empty repo"() {
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

        expect:
        RepositoryResults.asList(conn.getContextIDs()).size() == 2
    }

    def "begin() starts a transaction"() {
        setup:
        conn.begin()

        expect:
        conn.isActive()
    }

    def "isActive() is false before starting a transaction"() {
        expect:
        !conn.isActive()
    }

    def "commit() ends current transaction"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.begin()
        conn.add(s,p,o)
        conn.commit()

        expect:
        conn.size() == 1
        !conn.isActive()
    }

    def "rollback() reverts uncommitted removal of statement" (){
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.add(s,p,o)
        conn.begin()
        conn.clear()
        conn.rollback()

        expect:
        conn.size() == 1
    }

    def "rollback() after uncommitted add causes no increase in size"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.begin()
        conn.add(s,p,o)
        conn.rollback()

        expect:
        conn.size() == 0
    }

    def "rollback() only affects current transaction"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.begin()
        conn.add(o,p,s)
        conn.commit()
        conn.begin()
        conn.add(s,p,o)
        conn.rollback()

        expect:
        conn.size() == 1
    }

    def "prepareTupleQuery(String) provides simple working query"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")

        conn.add(s,p,o)

        TupleQuery tupleQuery = conn.prepareTupleQuery("SELECT ?s ?o WHERE { ?s <http://test.com/p> ?o . }")

        TupleQueryResult tqr = tupleQuery.evaluate()

        for(BindingSet bindingSet : tqr){
            for(Binding binding : bindingSet){
                if("o".equals(binding.getName()))
                    assert o.equals(binding.getValue())
                else if("s".equals(binding.getName()))
                    assert s.equals(binding.getValue())
            }
        }
    }

    def "prepareTupleQuery(String) with malformed query causes exception"() {
        setup:
        def query = "SELECT ?s ?o WHERE { ?s <http://test.com/p> ?o . "

        when:
        conn.prepareTupleQuery(query)

        then:
        thrown MalformedQueryException
    }

    def "prepareBooleanQuery(String) provides working boolean query"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")

        conn.add(s,p,o)

        def query = "ASK { ?s <http://test.com/p> ?o . }"

        when:
        BooleanQuery booleanQuery = conn.prepareBooleanQuery(query)

        then:
        booleanQuery.evaluate()
    }

    def "prepareBooleanQuery(String) with bad query causes exception"() {
        setup:
        def query = "{}"

        when:
        conn.prepareBooleanQuery(query)

        then:
        thrown MalformedQueryException
    }

    def "prepareGraphQuery(String) provides working graph query"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")

        conn.add(s,p,o)

        def query = "DESCRIBE ?s WHERE {?s <http://test.com/p> ?o .}"
        GraphQuery graphQuery = conn.prepareGraphQuery(query)

        when:
        GraphQueryResult graphQueryResult = graphQuery.evaluate()

        then:
        for(Statement statement : graphQueryResult){
            statement.equals(vf.createStatement(s,p,o))
        }
    }

    def "prepareGraphQuery(String) with bad query causes exception"() {
        setup:
        def query = "{}"

        when:
        conn.prepareGraphQuery(query)

        then:
        thrown MalformedQueryException
    }

    def "prepareUpdate(String) successfully adds statement"() {
        setup:
        def query = "INSERT { <http://test.com/s> <http://test.com/p> <http://test.com/o> } WHERE {}"
        Update update = conn.prepareUpdate(query)

        when:
        update.execute()

        then:
        conn.size() == 1
    }

    def "prepareUpdate(String successfully removes statement"() {
        setup:
        def s = vf.createIRI("http://test.com/s")
        def p = vf.createIRI("http://test.com/p")
        def o = vf.createIRI("http://test.com/o")
        conn.add(s,p,o)

        def query = "DELETE { <http://test.com/s> <http://test.com/p> <http://test.com/o> } WHERE {}"
        Update update = conn.prepareUpdate(query)

        when:
        update.execute()

        then:
        conn.size() == 0
    }

    def "prepareUpdate(String) with bad query causes exception"() {
        setup:
        def query = "{}"

        when:
        conn.prepareUpdate(query)

        then:
        thrown MalformedQueryException
    }

}
