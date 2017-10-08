package com.mobi.repository.impl.sesame.query

import com.mobi.rdf.core.utils.Values
import org.openrdf.model.impl.SimpleValueFactory
import org.openrdf.query.GraphQueryResult
import spock.lang.Specification

class SesameGraphQueryResultSpec extends Specification {

    def "getNamespaces() returns all namespaces"(){
        setup:
        def sesGQR = Mock(GraphQueryResult)
        def graphQueryResult = new SesameGraphQueryResult(sesGQR)
        Map<String,String> nameSpaces = [Prefix:"Namespace"]

        1 * sesGQR.getNamespaces() >> nameSpaces

        expect:
        graphQueryResult.getNamespaces().equals(nameSpaces)
    }

    def "hasNext() returns true if sesGQR has statements"() {
        setup:
        def sesGQR = Mock(GraphQueryResult)
        def graphQueryResult = new SesameGraphQueryResult(sesGQR)

        1 * sesGQR.hasNext() >> true

        expect:
        graphQueryResult.hasNext()
    }

    def "next() returns next statement in result"() {
        setup:
        def sesGQR = Mock(GraphQueryResult)
        def graphQueryResult = new SesameGraphQueryResult(sesGQR)
        def vf = SimpleValueFactory.getInstance();

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
        def subj = vf.createIRI("http://test.com/sub")
        def pred = vf.createIRI("http://test.com/pred")
        def obj = vf.createIRI("http://test.com/obj")
        def sesStatement = vf.createStatement(subj, pred, obj)
        def s = Values.matontoStatement(sesStatement)

        1 * sesGQR.next() >> sesStatement

        expect:
        s.equals(graphQueryResult.next())
    }

}
