package org.matonto.catalog.impl

import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import spock.lang.Specification


class SimpleDistributionSpec extends Specification {

    def distribution
    def vf = SimpleValueFactory.getInstance();

/*-
 * #%L
 * org.matonto.catalog.impl
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


    def setup() {
        distribution = new SimpleDistribution.Builder(vf.createIRI("http://test.com/dist/1"), "Test Dist 1")
                .build()
    }

    def "test equals"() {
        given:
        def distribution2 = new SimpleDistribution.Builder(vf.createIRI("http://test.com/dist/1"), "Test Dist 1")
                .build()
        def distribution3 = new SimpleDistribution.Builder(vf.createIRI("http://test.com/dist/2"), "Test Dist 2")
                .build()

        expect:
        distribution == distribution2
        distribution != distribution3
    }
}