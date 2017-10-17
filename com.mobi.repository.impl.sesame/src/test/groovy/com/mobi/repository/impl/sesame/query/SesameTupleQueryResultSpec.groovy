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

import org.openrdf.query.BindingSet
import org.openrdf.query.TupleQueryResult
import spock.lang.Specification

class SesameTupleQueryResultSpec extends Specification{
    def "getBindingNames() returns list of the names of a binding"() {
        setup:
        def sesameTQR = Mock(TupleQueryResult)
        def tupleQueryResult = new SesameTupleQueryResult(sesameTQR)
        List<String> bindingSetNames = ["test"]

        1 * sesameTQR.getBindingNames() >> bindingSetNames

        expect:
        bindingSetNames.equals(tupleQueryResult.getBindingNames())
    }

    def "hasNext() returns true if bindingSet has another value"() {
        setup:
        def sesameTQR = Mock(TupleQueryResult)
        def tupleQueryResult = new SesameTupleQueryResult(sesameTQR)

        1 * sesameTQR.hasNext() >> true

        expect:
        tupleQueryResult.hasNext()
    }

    def "hasNext() returns false if bindingSet does not have another value"() {
        setup:
        def sesameTQR = Mock(TupleQueryResult)
        def tupleQueryResult = new SesameTupleQueryResult(sesameTQR)

        1 * sesameTQR.hasNext() >> false

        expect:
        !tupleQueryResult.hasNext()
    }

    def "next() returns next BindingSet result"() {
        setup:
        def sesameTQR = Mock(TupleQueryResult)
        def tupleQueryResult = new SesameTupleQueryResult(sesameTQR)
        def sesBindingSet = Mock(BindingSet)

        when:
        tupleQueryResult.next()

        then:
        1 * sesameTQR.next() >> sesBindingSet
        noExceptionThrown()
    }

    def "remove() throws an UnsupportedOperationException"() {
        setup:
        def sesameTQR = Mock(TupleQueryResult)
        def tupleQueryResult = new SesameTupleQueryResult(sesameTQR)

        when:
        tupleQueryResult.remove()

        then:
        thrown(UnsupportedOperationException.class)
    }
}
