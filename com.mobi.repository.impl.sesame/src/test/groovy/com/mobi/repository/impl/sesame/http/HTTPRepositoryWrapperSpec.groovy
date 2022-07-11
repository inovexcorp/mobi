/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
package com.mobi.repository.impl.sesame.http

import com.mobi.repository.exception.RepositoryConfigException
import spock.lang.Specification

import java.lang.annotation.Annotation

class HTTPRepositoryWrapperSpec extends Specification {

    def "Invalid URLs throw an exception"() {
        setup:
        def props = new HTTPRepositoryConfig() {

            @Override
            String id() {
                return "test"
            }

            @Override
            String title() {
                return "test repo"
            }

            @Override
            String serverUrl() {
                return "urn:invalid"
            }

            @Override
            Class<? extends Annotation> annotationType() {
                return null
            }
        }

        def service = new HTTPRepositoryWrapper()

        when:
        service.start(props)

        then:
        thrown RepositoryConfigException
    }

    def "Valid URLs work"() {
        setup:
        def props = new HTTPRepositoryConfig() {

            @Override
            String id() {
                return "test"
            }

            @Override
            String title() {
                return "test repo"
            }

            @Override
            String serverUrl() {
                return "http://test.com/server"
            }

            @Override
            Class<? extends Annotation> annotationType() {
                return null
            }
        }

        def service = new HTTPRepositoryWrapper()

        when:
        service.start(props)

        then:
        noExceptionThrown()
    }

    def "Valid local URLs work"() {
        setup:
        def props = new HTTPRepositoryConfig() {

            @Override
            String id() {
                return "test"
            }

            @Override
            String title() {
                return "test repo"
            }

            @Override
            String serverUrl() {
                return "http://localhost/server"
            }

            @Override
            Class<? extends Annotation> annotationType() {
                return null
            }
        }

        def service = new HTTPRepositoryWrapper()

        when:
        service.start(props)

        then:
        noExceptionThrown()
    }
}
