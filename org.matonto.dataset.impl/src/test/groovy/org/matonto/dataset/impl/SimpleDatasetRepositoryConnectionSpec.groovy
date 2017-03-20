package org.matonto.dataset.impl

import org.matonto.dataset.ontology.dataset.Dataset
import org.matonto.rdf.api.Resource
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.matonto.repository.api.Repository
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.api.RepositoryManager
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper
import org.openrdf.repository.sail.SailRepository
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import org.openrdf.sail.memory.MemoryStore
import spock.lang.Shared
import spock.lang.Specification

class SimpleDatasetRepositoryConnectionSpec extends Specification {

    // Services
    @Shared
    vf = SimpleValueFactory.getInstance()

    // Mocks
    def connMock = Mock(RepositoryConnection)
    def repoManager = Mock(RepositoryManager)

    // Objects
    Repository systemRepo
    Repository testRepo
    RepositoryConnection systemConn
    RepositoryConnection testConn
    def repos = [ : ]
    def namedGraphPred = vf.createIRI(Dataset.namedGraph_IRI)

    @Shared
    datasetsInFile = [
            [ "filler" ],
            vf.createIRI("http://matonto.org/dataset/test1"),
            vf.createIRI("http://matonto.org/dataset/test2"),
            vf.createIRI("http://matonto.org/dataset/test3"),
            vf.createIRI("http://matonto.org/dataset/test4"),
            vf.createIRI("http://matonto.org/dataset/test5"),
            vf.createIRI("http://matonto.org/dataset/test6"),
            vf.createIRI("http://matonto.org/dataset/test7"),
            vf.createIRI("http://matonto.org/dataset/test8")
    ]

    def setup() {
        // Setup repos
        systemRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))
        systemRepo.initialize()
        systemConn = systemRepo.getConnection()
        testRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))
        testRepo.initialize()
        testConn = testRepo.getConnection()

        repos << [ "system": systemRepo ]
        repos << [ "test": testRepo ]

        // Load test data
        systemConn.add(Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG)))
        testConn.add(Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG)))

        // Setup mocks
        repoManager.getRepository("system") >> systemRepo
        repoManager.getRepository("test") >> testRepo
    }

    def cleanup() {
        if (systemConn != null) systemConn.close()
        if (testConn != null) testConn.close()
        systemRepo.shutDown()
        testRepo.shutDown()
    }

    def "Constructor correctly sets the dataset IRI"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset/1")
        def repo = "system"
        def conn = new SimpleDatasetRepositoryConnection(connMock, datasetIRI, repo, vf)

        expect:
        conn.getDataset() == datasetIRI
    }

    def "Constructor correctly sets the repo"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset/1")
        def repo = "system"
        def conn = new SimpleDatasetRepositoryConnection(connMock, datasetIRI, repo, vf)

        expect:
        conn.getRepositoryId() == repo
    }

    def "add(s) without a context will add data to the sdng"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def stmt = vf.createStatement(s, p, o)
        def conn = new SimpleDatasetRepositoryConnection(systemConn, datasetsInFile[1], "system", vf)

        when:
        conn.add(stmt)

        then:
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test1_system_dng")) == 1
    }

    def "add(s) with a context will add data to a new graph"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def c = vf.createIRI("urn:c")
        def stmt = vf.createStatement(s, p, o, c)
        def dataset = datasetsInFile[1]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.add(stmt)

        then:
        systemConn.size(c) == 1
        systemConn.getStatements(dataset, namedGraphPred, c).hasNext()
    }

    def "add(s) with a context will add data to an existing graph"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def c = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def stmt = vf.createStatement(s, p, o, c)
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.add(stmt)

        then:
        systemConn.size(c) == 2
        systemConn.getStatements(dataset, namedGraphPred, c).hasNext()
    }

    def "add(s, c) will add the necessary graph statement"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def c = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def stmt = vf.createStatement(s, p, o, c)
        def graph = vf.createIRI("urn:c")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.add(stmt, graph)

        then:
        systemConn.size(c) == 1
        systemConn.size(graph) == 1
        systemConn.getStatements(dataset, namedGraphPred, graph).hasNext()
    }

    def "add(s, c...) will add the necessary graph statements"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def c = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def stmt = vf.createStatement(s, p, o, c)
        def graphs = [ vf.createIRI("urn:c"), vf.createIRI("urn:c2") ] as Resource[]
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.add(stmt, graphs)

        then:
        systemConn.size(c) == 1
        systemConn.size(graphs[0]) == 1
        systemConn.size(graphs[1]) == 1
        systemConn.getStatements(dataset, namedGraphPred, graphs[0]).hasNext()
        systemConn.getStatements(dataset, namedGraphPred, graphs[1]).hasNext()
    }

    def "size() returns #message"() {
        setup:
        def conn = new SimpleDatasetRepositoryConnection(systemConn, datasetsInFile[dataset], "system", vf)

        expect:
        conn.size() == size

        where:
        message                                                                             | dataset | size
        "0 when there is only an empty system graph in the dataset"                         | 1       | 0
        "0 when there are no graphs in the dataset"                                         | 8       | 0
        "the total size of all statements in dataset graphs when no contexts are specified" | 2       | 4
    }

    def "size() returns the correct size when the dataset is not in the system repo"() {
        setup:
        def conn = new SimpleDatasetRepositoryConnection(testConn, datasetsInFile[5], "test", vf)

        expect:
        conn.size() == 3
    }

    def "#message"() {
        setup:
        def conn = new SimpleDatasetRepositoryConnection(systemConn, datasetsInFile[dataset], "system", vf)

        expect:
        conn.size(graphs as Resource[]) == size

        where:
        message                                                                                                 | dataset | size
        "size(c) returns the correct size of one graph in the dataset"                                          | 2       | 1
        "size(c...) returns the correct size of multiple graphs in the dataset"                                 | 2       | 2
        "size(c...) returns the total size of all statements in dataset graphs when all contexts are specified" | 2       | 4
        "size(c) returns 0 when the graph is not in the dataset"                                                | 2       | 0
        "size(c...) returns the correct number of statements when some of the graphs are in the dataset"        | 2       | 1

        graphs << [
                [ vf.createIRI("http://matonto.org/dataset/test2/graph1") ],
                [ vf.createIRI("http://matonto.org/dataset/test2/graph1"), vf.createIRI("http://matonto.org/dataset/test2/graph2") ],
                [ vf.createIRI("http://matonto.org/dataset/test2/graph1"), vf.createIRI("http://matonto.org/dataset/test2/graph2"), vf.createIRI("http://matonto.org/dataset/test2/graph3"), vf.createIRI("http://matonto.org/dataset/test2_system_dng") ],
                [ vf.createIRI("http://matonto.org/dataset/missing") ],
                [ vf.createIRI("http://matonto.org/dataset/test2/graph1"), vf.createIRI("http://matonto.org/dataset/missing") ]
        ]
    }
}