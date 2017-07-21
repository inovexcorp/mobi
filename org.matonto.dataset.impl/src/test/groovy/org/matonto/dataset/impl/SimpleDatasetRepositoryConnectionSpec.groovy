/*-
 * #%L
 * org.matonto.dataset.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
package org.matonto.dataset.impl

import org.matonto.dataset.ontology.dataset.Dataset
import org.matonto.persistence.utils.QueryResults
import org.matonto.persistence.utils.RepositoryResults
import org.matonto.rdf.api.Resource
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
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
import spock.lang.Unroll

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
    def defNamedGraphPred = vf.createIRI(Dataset.defaultNamedGraph_IRI)
    def sdNamedGraphPred = vf.createIRI(Dataset.systemDefaultNamedGraph_IRI)

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
        def dataset = datasetsInFile[1]
        def sdng = vf.createIRI("http://matonto.org/dataset/test1_system_dng")
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.add(stmt)

        then:
        !systemConn.getStatements(dataset, namedGraphPred, sdng).hasNext()
        !systemConn.getStatements(dataset, defNamedGraphPred, sdng).hasNext()
        systemConn.getStatements(dataset, sdNamedGraphPred, sdng).hasNext()
        systemConn.size(sdng) == 1
    }

    def "add(s) with a context will add data to a new graph"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def c = vf.createIRI("urn:c")
        def stmt = vf.createStatement(s, p, o, c)
        def dataset = datasetsInFile[1]
        def sdng = vf.createIRI("http://matonto.org/dataset/test1_system_dng")
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.add(stmt)

        then:
        !systemConn.getStatements(dataset, sdNamedGraphPred, c).hasNext()
        !systemConn.getStatements(dataset, defNamedGraphPred, c).hasNext()
        systemConn.getStatements(dataset, namedGraphPred, c).hasNext()
        systemConn.size(c) == 1
        systemConn.size(sdng) == 0
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

    def "add(s, p, o, c...) will add the necessary graph statements"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def graphs = [ vf.createIRI("urn:c"), vf.createIRI("urn:c2") ] as Resource[]
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.add(s, p, o, graphs)

        then:
        systemConn.size(graphs[0]) == 1
        systemConn.size(graphs[1]) == 1
        systemConn.getStatements(dataset, namedGraphPred, graphs[0]).hasNext()
        systemConn.getStatements(dataset, namedGraphPred, graphs[1]).hasNext()
    }

    def "add(model, c...) will add the necessary graph statements"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def s2 = vf.createIRI("urn:s2")
        def p2 = vf.createIRI("urn:p2")
        def o2 = vf.createLiteral("object2")
        def c2 = vf.createIRI("urn:c2")
        def s3 = vf.createIRI("urn:s3")
        def p3 = vf.createIRI("urn:p3")
        def o3 = vf.createLiteral("object3")
        def model1 = LinkedHashModelFactory.getInstance().createModel()
        def model2 = LinkedHashModelFactory.getInstance().createModel()
        model1.add(s, p, o)
        model1.add(s2, p2, o2, c2)
        model2.add(s3, p3, o3)
        model2.add(s3, p3, o3, c2)

        def sdng = vf.createIRI("http://matonto.org/dataset/test1_system_dng")
        def graphs = [ vf.createIRI("urn:graph1"), vf.createIRI("urn:graph2") ] as Resource[]
        def dataset = datasetsInFile[1]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.add(model1)
        conn.add(model2, graphs)

        then:
        systemConn.size(sdng) == 1
        systemConn.size(c2) == 1
        systemConn.size(graphs[0]) == 1
        systemConn.size(graphs[1]) == 1

        !systemConn.getStatements(dataset, sdNamedGraphPred, c2).hasNext()
        !systemConn.getStatements(dataset, defNamedGraphPred, c2).hasNext()
        systemConn.getStatements(dataset, namedGraphPred, c2).hasNext()

        !systemConn.getStatements(dataset, sdNamedGraphPred, graphs[0]).hasNext()
        !systemConn.getStatements(dataset, defNamedGraphPred, graphs[0]).hasNext()
        systemConn.getStatements(dataset, namedGraphPred, graphs[0]).hasNext()

        !systemConn.getStatements(dataset, sdNamedGraphPred, graphs[1]).hasNext()
        !systemConn.getStatements(dataset, defNamedGraphPred, graphs[1]).hasNext()
        systemConn.getStatements(dataset, namedGraphPred, graphs[1]).hasNext()

        systemConn.getStatements(dataset, sdNamedGraphPred, sdng).hasNext()
        !systemConn.getStatements(dataset, defNamedGraphPred, sdng).hasNext()
        !systemConn.getStatements(dataset, namedGraphPred, sdng).hasNext()
    }

    def "add(s) within a transaction does not internally commit"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def stmt = vf.createStatement(s, p, o)
        def conn = Spy(SimpleDatasetRepositoryConnection, constructorArgs: [systemConn, datasetsInFile[1], "system", vf])
        conn.begin()

        when:
        conn.add(stmt)

        then:
        conn.commit()
        0 * conn.begin()
        0 * conn.commit()
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test1_system_dng")) == 1
    }

    def "add(iter) within a transaction does not internally commit"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def stmt = vf.createStatement(s, p, o)
        def model = LinkedHashModelFactory.getInstance().createModel()
        model.add(stmt)
        def conn = Spy(SimpleDatasetRepositoryConnection, constructorArgs: [systemConn, datasetsInFile[1], "system", vf])
        conn.begin()

        when:
        conn.add(model)

        then:
        conn.commit()
        0 * conn.begin()
        0 * conn.commit()
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test1_system_dng")) == 1
    }

    def "add(s) without a transaction does internally commit"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def stmt = vf.createStatement(s, p, o)
        def conn = Spy(SimpleDatasetRepositoryConnection, constructorArgs: [systemConn, datasetsInFile[1], "system", vf])

        when:
        conn.add(stmt)

        then:
        1 * conn.begin()
        1 * conn.commit()
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test1_system_dng")) == 1
    }

    def "add(iter) without a transaction does internally commit"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def stmt = vf.createStatement(s, p, o)
        def model = LinkedHashModelFactory.getInstance().createModel()
        model.add(stmt)
        def conn = Spy(SimpleDatasetRepositoryConnection, constructorArgs: [systemConn, datasetsInFile[1], "system", vf])

        when:
        conn.add(model)

        then:
        1 * conn.begin()
        1 * conn.commit()
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test1_system_dng")) == 1
    }

    def "addDefault(s) without a context will add data to the sdng"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def stmt = vf.createStatement(s, p, o)
        def dataset = datasetsInFile[1]
        def sdng = vf.createIRI("http://matonto.org/dataset/test1_system_dng")
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.addDefault(stmt)

        then:
        systemConn.getStatements(dataset, sdNamedGraphPred, sdng).hasNext()
        !systemConn.getStatements(dataset, defNamedGraphPred, sdng).hasNext()
        !systemConn.getStatements(dataset, namedGraphPred, sdng).hasNext()
        systemConn.size(sdng) == 1
    }

    def "addDefault(s) with a context will add data to a new graph"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def c = vf.createIRI("urn:c")
        def stmt = vf.createStatement(s, p, o, c)
        def dataset = datasetsInFile[1]
        def sdng = vf.createIRI("http://matonto.org/dataset/test1_system_dng")
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.addDefault(stmt)

        then:
        !systemConn.getStatements(dataset, sdNamedGraphPred, c).hasNext()
        systemConn.getStatements(dataset, defNamedGraphPred, c).hasNext()
        !systemConn.getStatements(dataset, namedGraphPred, c).hasNext()
        systemConn.size(c) == 1
        systemConn.size(sdng) == 0
    }

    def "addDefault(s, p, o, c...) will add the necessary graph statements"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def graphs = [ vf.createIRI("urn:c"), vf.createIRI("urn:c2") ] as Resource[]
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.addDefault(s, p, o, graphs)

        then:
        systemConn.size(graphs[0]) == 1
        systemConn.size(graphs[1]) == 1
        systemConn.getStatements(dataset, defNamedGraphPred, graphs[0]).hasNext()
        systemConn.getStatements(dataset, defNamedGraphPred, graphs[1]).hasNext()
    }

    def "addDefault(model, c...) will add the necessary graph statements"() {
        setup:
        def s = vf.createIRI("urn:s")
        def p = vf.createIRI("urn:p")
        def o = vf.createLiteral("object")
        def s2 = vf.createIRI("urn:s2")
        def p2 = vf.createIRI("urn:p2")
        def o2 = vf.createLiteral("object2")
        def c2 = vf.createIRI("urn:c2")
        def s3 = vf.createIRI("urn:s3")
        def p3 = vf.createIRI("urn:p3")
        def o3 = vf.createLiteral("object3")
        def model1 = LinkedHashModelFactory.getInstance().createModel()
        def model2 = LinkedHashModelFactory.getInstance().createModel()
        model1.add(s, p, o)
        model1.add(s2, p2, o2, c2)
        model2.add(s3, p3, o3)
        model2.add(s3, p3, o3, c2)

        def sdng = vf.createIRI("http://matonto.org/dataset/test1_system_dng")
        def graphs = [ vf.createIRI("urn:graph1"), vf.createIRI("urn:graph2") ] as Resource[]
        def dataset = datasetsInFile[1]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.addDefault(model1)
        conn.addDefault(model2, graphs)

        then:
        systemConn.size(sdng) == 1
        systemConn.size(c2) == 1
        systemConn.size(graphs[0]) == 1
        systemConn.size(graphs[1]) == 1

        !systemConn.getStatements(dataset, sdNamedGraphPred, c2).hasNext()
        systemConn.getStatements(dataset, defNamedGraphPred, c2).hasNext()
        !systemConn.getStatements(dataset, namedGraphPred, c2).hasNext()

        !systemConn.getStatements(dataset, sdNamedGraphPred, graphs[0]).hasNext()
        systemConn.getStatements(dataset, defNamedGraphPred, graphs[0]).hasNext()
        !systemConn.getStatements(dataset, namedGraphPred, graphs[0]).hasNext()

        !systemConn.getStatements(dataset, sdNamedGraphPred, graphs[1]).hasNext()
        systemConn.getStatements(dataset, defNamedGraphPred, graphs[1]).hasNext()
        !systemConn.getStatements(dataset, namedGraphPred, graphs[1]).hasNext()

        systemConn.getStatements(dataset, sdNamedGraphPred, sdng).hasNext()
        !systemConn.getStatements(dataset, defNamedGraphPred, sdng).hasNext()
        !systemConn.getStatements(dataset, namedGraphPred, sdng).hasNext()
    }

    def "remove(s) without a context will remove data from the sdng"() {
        setup:
        def s = vf.createIRI("http://test.com/someThing")
        def p = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI)
        def o = vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        def stmt = vf.createStatement(s, p, o)
        def dataset = datasetsInFile[2]
        def sdng = vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.remove(stmt)

        then:
        systemConn.getStatements(dataset, sdNamedGraphPred, sdng).hasNext()
        systemConn.size(sdng) == 0
    }

    def "remove(s) with a context will remove data from that graph"() {
        setup:
        def s = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def p = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI)
        def o = vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        def c = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def stmt = vf.createStatement(s, p, o, c)
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.remove(stmt)

        then:
        systemConn.getStatements(dataset, defNamedGraphPred, c).hasNext()
        systemConn.size(c) == 0
    }

    def "remove(s) for a graph not in the dataset will not remove the dataset graph statement"() {
        setup:
        def s = vf.createIRI("http://matonto.org/dataset/test3/graph1")
        def p = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI)
        def o = vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        def c = vf.createIRI("http://matonto.org/dataset/test3/graph1")
        def stmt = vf.createStatement(s, p, o, c)
        def conn = new SimpleDatasetRepositoryConnection(systemConn, datasetsInFile[2], "system", vf)

        when:
        conn.remove(stmt)

        then:
        systemConn.getStatements(datasetsInFile[3], defNamedGraphPred, c).hasNext()
        systemConn.size(c) == 1
    }

    def "remove(s, p, o, c...) will remove the necessary graph data"() {
        setup:
        def graphs = [ vf.createIRI("http://matonto.org/dataset/test2/graph1"), vf.createIRI("urn:c2"), vf.createIRI("http://matonto.org/dataset/test3/graph1") ] as Resource[]
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.remove(s, p, o, graphs)

        then:
        systemConn.size(graphs[0]) == 0
        systemConn.getStatements(dataset, defNamedGraphPred, graphs[0]).hasNext()
        systemConn.size(graphs[2]) == 1

        where:
        s | p | o
        vf.createIRI("http://matonto.org/dataset/test2/graph1") | vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI) | vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        vf.createIRI("http://matonto.org/dataset/test2/graph1") | vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI) | null
        vf.createIRI("http://matonto.org/dataset/test2/graph1") | null | vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        vf.createIRI("http://matonto.org/dataset/test2/graph1") | null | null
        null | vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI) | vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        null | null | vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        null | vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI) | null
        null | null | null
    }

    @Unroll
    def "remove(s, p, o) will remove the necessary graph data"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.remove(s, p, o)

        then:
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test2_system_dng")) == 0
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test2/graph1")) == 1
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test2/graph2")) == 1
        systemConn.getStatements(dataset, sdNamedGraphPred, vf.createIRI("http://matonto.org/dataset/test2_system_dng")).hasNext()
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test3/graph1")) == 1
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test3/graph2")) == 1

        where:
        s | p | o
        vf.createIRI("http://test.com/someThing") | vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI) | vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        vf.createIRI("http://test.com/someThing") | vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI) | null
        vf.createIRI("http://test.com/someThing") | null | vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        vf.createIRI("http://test.com/someThing") | null | null
        null | vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI) | vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        null | null | vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        null | vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI) | null
        null | null | null
    }

    def "remove(model, c...) will remove the necessary graph data"() {
        setup:
        def s1 = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def p1 = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI)
        def o1 = vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        def s2 = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def p2 = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI)
        def o2 = vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        def s3 = vf.createIRI("http://matonto.org/dataset/test2/graph3")
        def p3 = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI)
        def o3 = vf.createIRI("http://www.w3.org/2002/07/owl#Thing")

        def c1 = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def c2 = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def c3 = vf.createIRI("http://matonto.org/dataset/test2/graph3")
        def sdng = vf.createIRI("http://matonto.org/dataset/test2_system_dng")

        def model1 = LinkedHashModelFactory.getInstance().createModel()
        def model2 = LinkedHashModelFactory.getInstance().createModel()
        model1.add(s1, p1, o1)
        model1.add(s2, p2, o2, c2)
        model2.add(s3, p3, o3)
        model2.add(s3, p3, o3, c2)

        def graphs = [ c3, vf.createIRI("urn:graph2") ] as Resource[]
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.remove(model1)
        conn.remove(model2, graphs)

        then:
        systemConn.size(sdng) == 1
        systemConn.size(c1) == 1
        systemConn.size(c2) == 0
        systemConn.size(c3) == 0

        systemConn.getStatements(dataset, defNamedGraphPred, c1).hasNext()
        systemConn.getStatements(dataset, namedGraphPred, c2).hasNext()
        systemConn.getStatements(dataset, namedGraphPred, c3).hasNext()
        systemConn.getStatements(dataset, sdNamedGraphPred, sdng).hasNext()
    }

    def "begin starts a transaction"() {
        def conn = new SimpleDatasetRepositoryConnection(systemConn, datasetsInFile[1], "system", vf)
        conn.begin()

        expect:
        conn.isActive()

        cleanup:
        conn.commit()
        conn.close()
    }

    def "commit ends a transaction"() {
        def conn = new SimpleDatasetRepositoryConnection(systemConn, datasetsInFile[1], "system", vf)
        conn.begin()
        conn.commit()

        expect:
        !conn.isActive()
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

    def "getSystemDefaultNamedGraph returns the correct resource"() {
        setup:
        def conn = new SimpleDatasetRepositoryConnection(systemConn, datasetsInFile[1], "system", vf)

        expect:
        conn.getSystemDefaultNamedGraph() == vf.createIRI("http://matonto.org/dataset/test1_system_dng")
    }

    def "getNamedGraphs returns the correct set of resources"() {
        setup:
        def conn = new SimpleDatasetRepositoryConnection(systemConn, datasetsInFile[2], "system", vf)
        def expectedGraphs = [
                vf.createIRI("http://matonto.org/dataset/test2/graph2"),
                vf.createIRI("http://matonto.org/dataset/test2/graph3")
        ]

        expect:
        RepositoryResults.asList(conn.getNamedGraphs()) == expectedGraphs
    }

    def "getDefaultNamedGraphs returns the correct set of resources"() {
        setup:
        def conn = new SimpleDatasetRepositoryConnection(systemConn, datasetsInFile[2], "system", vf)
        def expectedGraphs = [
                vf.createIRI("http://matonto.org/dataset/test2/graph1")
        ]

        expect:
        RepositoryResults.asList(conn.getDefaultNamedGraphs()) == expectedGraphs
    }

    def "clear() removes all graphs and graph links"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.clear()

        then:
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test2/graph1")) == 0
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test2/graph2")) == 0
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test2/graph3")) == 0
        systemConn.size(vf.createIRI("http://matonto.org/dataset/test2_system_dng")) == 0

        !systemConn.getStatements(dataset, defNamedGraphPred, null).hasNext()
        !systemConn.getStatements(dataset, namedGraphPred, null).hasNext()
        systemConn.getStatements(dataset, sdNamedGraphPred, null).hasNext()
    }

    def "clear(c) removes a dataset graph and graph links"() {
        setup:
        def graph1 = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def graph2 = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def graph3 = vf.createIRI("http://matonto.org/dataset/test2/graph3")
        def sdng = vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.clear(graph1)

        then:
        systemConn.size(graph1) == 0
        systemConn.size(graph2) == 1
        systemConn.size(graph3) == 1
        systemConn.size(sdng) == 1

        !systemConn.getStatements(dataset, null, graph1).hasNext()
        systemConn.getStatements(dataset, null, graph2).hasNext()
        systemConn.getStatements(dataset, null, graph3).hasNext()
        systemConn.getStatements(dataset, null, sdng).hasNext()
    }

    def "clear(c...) removes a dataset graph and graph links"() {
        setup:
        def graph1 = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def graph2 = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def graph3 = vf.createIRI("http://matonto.org/dataset/test2/graph3")
        def sdng = vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.clear(graph1, graph2)

        then:
        systemConn.size(graph1) == 0
        systemConn.size(graph2) == 0
        systemConn.size(graph3) == 1
        systemConn.size(sdng) == 1

        !systemConn.getStatements(dataset, null, graph1).hasNext()
        !systemConn.getStatements(dataset, null, graph2).hasNext()
        systemConn.getStatements(dataset, null, graph3).hasNext()
        systemConn.getStatements(dataset, null, sdng).hasNext()
    }

    def "clear(c) does not remove a non-dataset graph"() {
        setup:
        def graph = vf.createIRI("http://matonto.org/dataset/test3/graph1")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.clear(graph)

        then:
        systemConn.size(graph) == 1
        systemConn.getStatements(datasetsInFile[3], null, graph).hasNext()
    }

    def "clear(sdng) does not remove the system default named graph"() {
        setup:
        def sdng = vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.clear(sdng)

        then:
        systemConn.size(sdng) == 0
        systemConn.getStatements(dataset, sdNamedGraphPred, sdng).hasNext()
    }

    def "addNamedGraph(c) adds an existing graph to the dataset"() {
        setup:
        def graph = vf.createIRI("http://matonto.org/dataset/test3/graph1")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.addNamedGraph(graph)

        then:
        systemConn.size(graph) == 1
        systemConn.getStatements(dataset, namedGraphPred, graph).hasNext()
    }

    def "addNamedGraph(c) adds a non-existent graph to the dataset"() {
        setup:
        def graph = vf.createIRI("urn:test")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.addNamedGraph(graph)

        then:
        systemConn.size(graph) == 0
        systemConn.getStatements(dataset, namedGraphPred, graph).hasNext()
    }

    def "addDefaultNamedGraph(c) adds an existing graph to the dataset"() {
        setup:
        def graph = vf.createIRI("http://matonto.org/dataset/test3/graph1")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.addDefaultNamedGraph(graph)

        then:
        systemConn.size(graph) == 1
        systemConn.getStatements(dataset, defNamedGraphPred, graph).hasNext()
    }

    def "addDefaultNamedGraph(c) adds a non-existent graph to the dataset"() {
        setup:
        def graph = vf.createIRI("urn:test")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.addDefaultNamedGraph(graph)

        then:
        systemConn.size(graph) == 0
        systemConn.getStatements(dataset, defNamedGraphPred, graph).hasNext()
    }

    def "removeGraph(c) removes a graph from the dataset"() {
        setup:
        def graph = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.removeGraph(graph)

        then:
        systemConn.size(graph) == 1
        !systemConn.getStatements(dataset, null, graph).hasNext()
    }

    def "removeGraph(c) does not remove a non-existent graph from the dataset"() {
        setup:
        def graph = vf.createIRI("urn:test")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.removeGraph(graph)

        then:
        systemConn.size(graph) == 0
        !systemConn.getStatements(dataset, null, graph).hasNext()
    }

    def "removeGraph(c) does not remove the system default named graph from the dataset"() {
        setup:
        def graph = vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)

        when:
        conn.removeGraph(graph)

        then:
        systemConn.size(graph) == 1
        systemConn.getStatements(dataset, sdNamedGraphPred, graph).hasNext()
    }

    def "getStatements(null, null, null) correctly returns all triples in the datset"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)
        def graphs = [
                vf.createIRI("http://matonto.org/dataset/test2/graph1"),
                vf.createIRI("http://matonto.org/dataset/test2/graph2"),
                vf.createIRI("http://matonto.org/dataset/test2/graph3"),
                vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        ] as Resource[]

        when:
        def results = conn.getStatements(null, null, null)

        then:
        RepositoryResults.asList(results) == RepositoryResults.asList(systemConn.getStatements(null, null, null, graphs))
    }

    def "getStatements(s, null, null) correctly returns that subject in the datset"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)
        def filter = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def graphs = [
                vf.createIRI("http://matonto.org/dataset/test2/graph1"),
                vf.createIRI("http://matonto.org/dataset/test2/graph2"),
                vf.createIRI("http://matonto.org/dataset/test2/graph3"),
                vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        ] as Resource[]

        when:
        def results = RepositoryResults.asList(conn.getStatements(filter, null, null))

        then:
        results.size() == 1
        results == RepositoryResults.asList(systemConn.getStatements(filter, null, null, graphs))
    }

    def "getStatements(null, p, null) correctly returns that predicate in the datset"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)
        def filter = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI)
        def graphs = [
                vf.createIRI("http://matonto.org/dataset/test2/graph1"),
                vf.createIRI("http://matonto.org/dataset/test2/graph2"),
                vf.createIRI("http://matonto.org/dataset/test2/graph3"),
                vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        ] as Resource[]

        when:
        def results = RepositoryResults.asList(conn.getStatements(null, filter, null))

        then:
        results.size() == 4
        results == RepositoryResults.asList(systemConn.getStatements(null, filter, null, graphs))
    }

    def "getStatements(null, null, o) correctly returns that object in the datset"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)
        def filter = vf.createIRI("http://www.w3.org/2002/07/owl#Thing")
        def graphs = [
                vf.createIRI("http://matonto.org/dataset/test2/graph1"),
                vf.createIRI("http://matonto.org/dataset/test2/graph2"),
                vf.createIRI("http://matonto.org/dataset/test2/graph3"),
                vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        ] as Resource[]

        when:
        def results = RepositoryResults.asList(conn.getStatements(null, null, filter))

        then:
        results.size() == 4
        results == RepositoryResults.asList(systemConn.getStatements(null, null, filter, graphs))
    }

    def "getStatements(null, null, null, graphs) correctly returns those graphs in the datset"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)
        def graphs = [
                vf.createIRI("http://matonto.org/dataset/test2/graph1"),
                vf.createIRI("http://matonto.org/dataset/test2/graph2"),
                vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        ] as Resource[]

        when:
        def results = RepositoryResults.asList(conn.getStatements(null, null, null, graphs))

        then:
        results.size() == 3
        results == RepositoryResults.asList(systemConn.getStatements(null, null, null, graphs))
    }

    def "getContextIDs() correctly returns the graphs in the datset"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)
        def graphs = [
                vf.createIRI("http://matonto.org/dataset/test2/graph1"),
                vf.createIRI("http://matonto.org/dataset/test2/graph2"),
                vf.createIRI("http://matonto.org/dataset/test2/graph3"),
                vf.createIRI("http://matonto.org/dataset/test2_system_dng")
        ]

        when:
        def results = RepositoryResults.asList(conn.getContextIDs())

        then:
        results.size() == 4
        results == graphs
    }

    def "prepareTupleQuery(query) #msg"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)
        def queryString = query
        def tupleQuery = conn.prepareTupleQuery(queryString)

        when:
        def results = tupleQuery.evaluate()

        then:
        QueryResults.asList(results).size() == expectedSize

        where:
        msg | query | expectedSize
        "without a dataset declaration properly queries the dataset graphs"             | "SELECT * WHERE { ?s ?p ?o }"                                             | 2
        "without a dataset declaration properly queries the dataset graphs with named"  | "SELECT * WHERE { {?s ?p ?o} UNION {GRAPH ?g {?s ?p ?o}} }"               | 4
        "with a dataset declaration properly queries the dataset graphs"                | "SELECT * FROM NAMED <:g1> WHERE { ?s ?p ?o }"                            | 2
        "with a dataset declaration properly queries the dataset graphs with named"     | "SELECT * FROM <:g1> WHERE { {?s ?p ?o} UNION {GRAPH ?g {?s ?p ?o}} }"    | 4
        "works regardless of case"                                                      | "SELECT * FroM <:g1> WHERE { {?s a ?o} UNioN {GRAPH ?g {?s ?p ?o}} }"     | 4
        "works with a subquery and dataset clause"                                      | "SELECT * from <:g1> WHERE { ?s ?p ?o . { select * where { ?s a ?o } }}"    | 2
    }

    def "prepareTupleQuery(query, baseUri) works"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)
        def queryString = "SELECT * WHERE { ?s ?p ?o }"
        def tupleQuery = conn.prepareTupleQuery(queryString, "urn:test")

        when:
        def results = tupleQuery.evaluate()

        then:
        QueryResults.asList(results).size() == 2
    }

    def "prepareGraphQuery(query) #msg"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)
        def queryString = query
        def graphQuery = conn.prepareGraphQuery(queryString)

        when:
        def results = graphQuery.evaluate()

        then:
        QueryResults.asList(results).size() == expectedSize

        where:
        msg | query | expectedSize
        "without a dataset declaration properly queries the dataset graphs"             | "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }"                                             | 2
        "without a dataset declaration properly queries the dataset graphs with named"  | "CONSTRUCT { ?s ?p ?o } WHERE { {?s ?p ?o} UNION {GRAPH ?g {?s ?p ?o}} }"               | 4
        "with a dataset declaration properly queries the dataset graphs"                | "CONSTRUCT { ?s ?p ?o } FROM NAMED <:g1> WHERE { ?s ?p ?o }"                            | 2
        "with a dataset declaration properly queries the dataset graphs with named"     | "CONSTRUCT { ?s ?p ?o } FROM <:g1> WHERE { {?s ?p ?o} UNION {GRAPH ?g {?s ?p ?o}} }"    | 4
        "works regardless of case"                                                      | "CONSTRUCT { ?s ?p ?o } FroM <:g1> WHERE { {?s ?p ?o} UNioN {GRAPH ?g {?s ?p ?o}} }"     | 4
        "works with a subquery and dataset clause"                                      | "CONSTRUCT { ?s ?p ?o } FROM <:g1> WHERE { ?s ?p ?o . { select * where { ?s a ?o } }}"    | 2
    }

    def "prepareGraphQuery(query, baseUri) works"() {
        setup:
        def dataset = datasetsInFile[2]
        def conn = new SimpleDatasetRepositoryConnection(systemConn, dataset, "system", vf)
        def queryString = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }"
        def graphQuery = conn.prepareGraphQuery(queryString, "urn:test")

        when:
        def results = graphQuery.evaluate()

        then:
        QueryResults.asList(results).size() == 2
    }
}