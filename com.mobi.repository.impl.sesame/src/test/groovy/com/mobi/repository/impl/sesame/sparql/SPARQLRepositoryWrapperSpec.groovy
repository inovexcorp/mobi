package com.mobi.repository.impl.sesame.sparql

import com.mobi.repository.exception.RepositoryConfigException
import spock.lang.Specification


class SPARQLRepositoryWrapperSpec extends Specification {

    def "Invalid URLs throw an exception"() {
        setup:
        def props = [
                id: "test",
                title: "test repo",
                endpointUrl: "urn:test"
        ]

        def service = new SPARQLRepositoryWrapper()

        when:
        service.start(props)

        then:
        thrown RepositoryConfigException
    }

    def "Valid URLs work"() {
        setup:
        def props = [
                id: "test",
                title: "test repo",
                endpointUrl: "http://test.com/sparql"
        ]

        def service = new SPARQLRepositoryWrapper()

        when:
        service.start(props)

        then:
        noExceptionThrown()
    }
}