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

import com.mobi.query.TupleQueryResult
import com.mobi.query.api.TupleQuery
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory
import com.mobi.repository.api.RepositoryConnection
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper
import org.eclipse.rdf4j.repository.sail.SailRepository
import org.eclipse.rdf4j.sail.memory.MemoryStore
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