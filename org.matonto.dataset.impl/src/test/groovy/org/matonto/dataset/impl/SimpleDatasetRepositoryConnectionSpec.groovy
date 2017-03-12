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

    def "size() returns 0 when there are no graphs in the dataset"() {
    }

    def "size() returns the total size of all statements in dataset graphs when no contexts are specified"() {
    }

    def "size(c) returns the correct size of one graph in the dataset"() {
    }

    def "size(c...) returns the correct size of multiple graphs in the dataset"() {
    }

    def "size(c...) returns the total size of all statements in dataset graphs when all contexts are specified"() {
    }

    def "size(c) returns 0 when the graph is not in the dataset"() {
    }

    def "size(c...) returns the correct number of statements when some of the graphs are in the dataset"() {
    }
}