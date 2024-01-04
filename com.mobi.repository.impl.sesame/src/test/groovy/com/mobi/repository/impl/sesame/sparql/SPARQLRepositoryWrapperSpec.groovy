/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
package com.mobi.repository.impl.sesame.sparql

import com.mobi.repository.exception.RepositoryConfigException
import spock.lang.Specification

import java.lang.annotation.Annotation


class SPARQLRepositoryWrapperSpec extends Specification {

    def "Invalid URLs throw an exception"() {
        setup:
        def props = new SPARQLRepositoryConfig() {

            @Override
            String id() {
                return "test"
            }

            @Override
            String title() {
                return "test repo"
            }

            @Override
            String endpointUrl() {
                return "urn:test"
            }

            @Override
            String updateEndpointUrl() {
                return "urn:test/statements"
            }

            @Override
            Class<? extends Annotation> annotationType() {
                return null
            }
        }

        def service = new SPARQLRepositoryWrapper()

        when:
        service.start(props)

        then:
        thrown RepositoryConfigException
    }

    def "Valid URLs work"() {
        setup:
        def props = new SPARQLRepositoryConfig() {

            @Override
            String id() {
                return "test"
            }

            @Override
            String title() {
                return "test repo"
            }

            @Override
            String endpointUrl() {
                return "http://test.com/sparql"
            }

            @Override
            String updateEndpointUrl() {
                return "http://test.com/sparql/statements"
            }

            @Override
            Class<? extends Annotation> annotationType() {
                return null
            }
        }

        def service = new SPARQLRepositoryWrapper()

        when:
        service.start(props)

        then:
        noExceptionThrown()
    }

    def "Valid local URLs work"() {
        setup:
        def props = new SPARQLRepositoryConfig() {

            @Override
            String id() {
                return "test"
            }

            @Override
            String title() {
                return "test repo"
            }

            @Override
            String endpointUrl() {
                return "http://localhost/sparql"
            }

            @Override
            String updateEndpointUrl() {
                return "http://localhost/sparql/statements"
            }

            @Override
            Class<? extends Annotation> annotationType() {
                return null
            }
        }

        def service = new SPARQLRepositoryWrapper()

        when:
        service.start(props)

        then:
        noExceptionThrown()
    }
}
