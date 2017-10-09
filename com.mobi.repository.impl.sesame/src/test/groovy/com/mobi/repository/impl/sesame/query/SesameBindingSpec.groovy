package com.mobi.repository.impl.sesame.query

import com.mobi.rdf.core.utils.Values
import org.openrdf.model.IRI
import org.openrdf.model.impl.ValueFactoryImpl
import spock.lang.Specification
import com.mobi.query.api.Binding

class SesameBindingSpec extends Specification {

    def "getName() returns binding name"() {
        setup:
        def sesBinding = Mock(org.openrdf.query.Binding)
        def matBinding = new SesameBinding(sesBinding);

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

        1 * sesBinding.getName() >> "testName"

        expect:
        matBinding.getName().equals("testName")
    }

    def "getValue() returns binding's value"() {
        setup:
        def sesBinding = Mock(org.openrdf.query.Binding)
        def matBinding = new SesameBinding(sesBinding)
        def testVal =  new ValueFactoryImpl().createIRI("http://testVal.com");

        1 * sesBinding.getValue() >> testVal

        expect:
        matBinding.getValue().equals(Values.mobiIRI(testVal))
    }

}
