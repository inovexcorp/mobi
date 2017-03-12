package org.matonto.dataset.impl

import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.repository.api.RepositoryConnection
import spock.lang.Specification


class SimpleDatasetRepositoryConnectionSpec extends Specification {

    // Services
    def vf = SimpleValueFactory.getInstance()

    // Mocks
    def connMock = Mock(RepositoryConnection)

    def "Constructor correctly sets the dataset IRI"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset/1")
        def repo = "system"
        def conn = new SimpleDatasetRepositoryConnection(connMock, datasetIRI, repo)

        expect:
        conn.getDataset() == datasetIRI
    }

    def "Constructor correctly sets the repo"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset/1")
        def repo = "system"
        def conn = new SimpleDatasetRepositoryConnection(connMock, datasetIRI, repo)

        expect:
        conn.getRepositoryId() == repo
    }
}