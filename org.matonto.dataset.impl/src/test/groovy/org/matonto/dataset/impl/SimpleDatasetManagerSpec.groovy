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

import org.matonto.catalog.api.CatalogManager
import org.matonto.catalog.api.PaginatedSearchResults
import org.matonto.dataset.api.builder.DatasetRecordConfig
import org.matonto.dataset.api.builder.OntologyIdentifier
import org.matonto.dataset.ontology.dataset.Dataset
import org.matonto.dataset.ontology.dataset.DatasetFactory
import org.matonto.dataset.ontology.dataset.DatasetRecord
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory
import org.matonto.dataset.pagination.DatasetPaginatedSearchParams
import org.matonto.ontologies.rdfs.Resource
import org.matonto.rdf.api.IRI
import org.matonto.rdf.api.Model
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.matonto.rdf.orm.conversion.impl.*
import org.matonto.rdf.orm.impl.ThingFactory
import org.matonto.repository.api.Repository
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.api.RepositoryManager
import org.matonto.repository.base.RepositoryResult
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper
import org.openrdf.repository.sail.SailRepository
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import org.openrdf.sail.memory.MemoryStore
import spock.lang.Shared
import spock.lang.Specification

import java.util.stream.Collectors
import java.util.stream.Stream

class SimpleDatasetManagerSpec extends Specification {

    def service = new SimpleDatasetManager()

    // Services
    @Shared
    vf = SimpleValueFactory.getInstance()
    def mf = LinkedHashModelFactory.getInstance()
    def dsFactory = new DatasetFactory()
    def dsRecFactory = new DatasetRecordFactory()
    def thingFactory = new ThingFactory()
    def vcr = new DefaultValueConverterRegistry()

    // Mocks
    def catalogManagerMock = Mock(CatalogManager)
    def repositoryMock = Mock(Repository)
    def connMock = Mock(RepositoryConnection)
    def resultsMock = Mock(RepositoryResult)
    def repoManagerMock = Mock(RepositoryManager)

    // Objects
    def localCatalog = vf.createIRI("http://matonto.org/test/catalog-local")
    def datasetPred = vf.createIRI(DatasetRecord.dataset_IRI)
    def repoPred = vf.createIRI(DatasetRecord.repository_IRI)
    def namedGraphPred = vf.createIRI(Dataset.namedGraph_IRI)
    def defNamedGraphPred = vf.createIRI(Dataset.defaultNamedGraph_IRI)
    def sysDefNgPred = vf.createIRI(Dataset.systemDefaultNamedGraph_IRI)
    def recordIRI = vf.createIRI("http://test.com/record1")
    def systemRepo
    def testRepo
    def systemConn
    def testConn
    def dynamicConn
    def repos = [ : ]
    def datasetIRI
    def dataset
    def record
    
    @Shared
    numSystemDS = 5

    @Shared
    numTestDS = 3

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

    @Shared
    recordsInFile = [
            [ "filler" ],
            vf.createIRI("http://matonto.org/record/dataset/test1"),
            vf.createIRI("http://matonto.org/record/dataset/test2"),
            vf.createIRI("http://matonto.org/record/dataset/test3"),
            vf.createIRI("http://matonto.org/record/dataset/test4"),
            vf.createIRI("http://matonto.org/record/dataset/test5"),
            vf.createIRI("http://matonto.org/record/dataset/test6"),
            vf.createIRI("http://matonto.org/record/dataset/test7"),
            vf.createIRI("http://matonto.org/record/dataset/test8")
    ]

    @Shared
    defaultNamedGraphsPerDS = [
            [ "filler" ],
            [],
            [ vf.createIRI("http://matonto.org/dataset/test2/graph1") ],
            [ vf.createIRI("http://matonto.org/dataset/test3/graph1"), vf.createIRI("http://matonto.org/dataset/test3/graph4") ],
            [ vf.createIRI("http://matonto.org/dataset/test3/graph4") ],
            [ vf.createIRI("http://matonto.org/dataset/test5/graph1") ],
            [ vf.createIRI("http://matonto.org/dataset/test2/graph1") ],
            [ vf.createIRI("http://matonto.org/dataset/test7/graph1") ],
            []
    ]

    @Shared
    namedGraphsPerDS = [
            [ "filler" ],
            [],
            [ vf.createIRI("http://matonto.org/dataset/test2/graph2"), vf.createIRI("http://matonto.org/dataset/test2/graph3") ],
            [ vf.createIRI("http://matonto.org/dataset/test3/graph2"), vf.createIRI("http://matonto.org/dataset/test3/graph3"), vf.createIRI("http://matonto.org/dataset/test3/graph5") ],
            [ vf.createIRI("http://matonto.org/dataset/test3/graph5") ],
            [ vf.createIRI("http://matonto.org/dataset/test5/graph2") ],
            [ vf.createIRI("http://matonto.org/dataset/test2/graph2") ],
            [ vf.createIRI("http://matonto.org/dataset/test7/graph2") ],
            []
    ]

    @Shared
    sysDefNamedGraphsPerDS = [
            [ "filler" ],
            [ vf.createIRI("http://matonto.org/dataset/test1_system_dng") ],
            [ vf.createIRI("http://matonto.org/dataset/test2_system_dng") ],
            [ vf.createIRI("http://matonto.org/dataset/test3_system_dng") ],
            [ vf.createIRI("http://matonto.org/dataset/test4_system_dng") ],
            [ vf.createIRI("http://matonto.org/dataset/test5_system_dng") ],
            [ vf.createIRI("http://matonto.org/dataset/test6_system_dng") ],
            [ vf.createIRI("http://matonto.org/dataset/test7_system_dng") ],
            []
    ]
    
    def setup() {
        systemRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))
        systemRepo.initialize()
        systemConn = systemRepo.getConnection()

        testRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))
        testRepo.initialize()
        testConn = testRepo.getConnection()

        repos << [ "system": systemRepo ]
        repos << [ "test": testRepo ]

        dsFactory.setValueFactory(vf)
        dsFactory.setModelFactory(mf)
        dsFactory.setValueConverterRegistry(vcr)
        dsRecFactory.setValueFactory(vf)
        dsRecFactory.setModelFactory(mf)
        dsRecFactory.setValueConverterRegistry(vcr)
        thingFactory.setModelFactory(mf)
        thingFactory.setValueFactory(vf)
        thingFactory.setValueConverterRegistry(vcr)

        vcr.registerValueConverter(dsFactory)
        vcr.registerValueConverter(dsRecFactory)
        vcr.registerValueConverter(thingFactory)
        vcr.registerValueConverter(new ResourceValueConverter())
        vcr.registerValueConverter(new IRIValueConverter())
        vcr.registerValueConverter(new DoubleValueConverter())
        vcr.registerValueConverter(new IntegerValueConverter())
        vcr.registerValueConverter(new FloatValueConverter())
        vcr.registerValueConverter(new ShortValueConverter())
        vcr.registerValueConverter(new StringValueConverter())
        vcr.registerValueConverter(new ValueValueConverter())
        vcr.registerValueConverter(new LiteralValueConverter())

        datasetIRI = datasetsInFile[1]
        dataset = dsFactory.createNew(datasetIRI)
        record = dsRecFactory.createNew(recordIRI)
        
        // Set Services
        service.setDatasetRecordFactory(dsRecFactory)
        service.setDatasetFactory(dsFactory)

        service.setCatalogManager(catalogManagerMock)
        service.setRepository(repositoryMock)
        service.setValueFactory(vf)
        service.setRepoManager(repoManagerMock)

        // Mock Behavior
        repositoryMock.getConnection() >> connMock
        connMock.getStatements(*_) >> resultsMock

        catalogManagerMock.getLocalCatalogIRI() >> localCatalog
        
        repoManagerMock.getRepository("system") >> Optional.of(repositoryMock)
        repoManagerMock.getRepository("test") >> Optional.of(testRepo)
        
        record.setDataset(dataset)
        record.setRepository("system")
    }

    def cleanup() {
        if (dynamicConn != null) dynamicConn.close()
        if (systemConn != null) systemConn.close()
        systemRepo.shutDown()
        if (testConn != null) testConn.close()
        systemRepo.shutDown()
    }

    def "getDatasetRecord(dataset, repo) returns the correct DatasetRecord when the dataset exists"() {
        setup:
        def repo = "system"
        def datasetIri = vf.createIRI("http://matonto.org/dataset/test")
        def dataset = dsFactory.createNew(datasetIri)
        def recordIri = vf.createIRI("http://matonto.org/record/dataset/test")
        def record = dsRecFactory.createNew(recordIri)
        record.setDataset(dataset)
        record.setRepository(repo)

        resultsMock.hasNext() >>> [true, true, false]
        resultsMock.next() >>> [
                vf.createStatement(recordIri, datasetPred, datasetIri),
                vf.createStatement(recordIri, repoPred, vf.createLiteral(repo))
        ]
        1 * catalogManagerMock.getRecord(!null, recordIri, !null) >> Optional.of(record)

        when:
        def results = service.getDatasetRecord(datasetIri, repo)

        then:
        results != Optional.empty()
        results.get().getResource() == recordIri
        results.get().getRepository().get() == "system"
        results.get().getDataset_resource().get() == datasetIri
    }

    def "getDatasetRecord(dataset, repo) returns an emtpy Optional when the dataset does not exist"() {
        setup:
        def repo = "system"
        def datasetIri = vf.createIRI("http://matonto.org/dataset/test")

        resultsMock.hasNext() >> false

        when:
        def results = service.getDatasetRecord(datasetIri, repo)

        then:
        results == Optional.empty()
    }

    def "getDatasetRecord(dataset, repo) returns the correct DatasetRecord when more than one DatasetRecord points to that Dataset"() {
        setup:
        def repo = "system"
        def datasetIri = vf.createIRI("http://matonto.org/dataset/test")
        def dataset = dsFactory.createNew(datasetIri)
        def recordIri = vf.createIRI("http://matonto.org/record/dataset/test")
        def record = dsRecFactory.createNew(recordIri)
        record.setDataset(dataset)
        record.setRepository(repo)

        resultsMock.hasNext() >>> [true, true, true, false]
        resultsMock.next() >>> [
                vf.createStatement(recordIri, datasetPred, datasetIri),
                vf.createStatement(recordIri, repoPred, vf.createLiteral("someOtherRepo")),
                vf.createStatement(recordIri, repoPred, vf.createLiteral(repo))
        ]
        1 * catalogManagerMock.getRecord(!null, recordIri, !null) >> Optional.of(record)

        when:
        def results = service.getDatasetRecord(datasetIri, repo)

        then:
        results != Optional.empty()
        results.get().getResource() == recordIri
        results.get().getRepository().get() == "system"
        results.get().getDataset_resource().get() == datasetIri
    }

    def "getDatasetRecord(record) returns the correct DatasetRecord"() {
        setup:
        def repo = "system"
        def datasetIRI = vf.createIRI("http://matonto.org/dataset/test")
        def dataset = dsFactory.createNew(datasetIRI)
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test")
        def record = dsRecFactory.createNew(recordIRI)
        record.setDataset(dataset)
        record.setRepository(repo)

        when:
        def results = service.getDatasetRecord(recordIRI)

        then:
        1 * catalogManagerMock.getRecord(*_) >> Optional.of(record)
        results != Optional.empty()
        results.get().getResource() == recordIRI
        results.get().getRepository().get() == "system"
        results.get().getDataset_resource().get() == datasetIRI
    }

    def "getDatasetRecord(record) returns empty optional when the dataset does not exist"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test")

        when:
        def results = service.getDatasetRecord(recordIRI)

        then:
        1 * catalogManagerMock.getRecord(*_) >> Optional.empty()
        results == Optional.empty()
    }

    def "getDatasetRecords() returns PaginatedSearchResults with a set of DatasetRecords from the repo"() {
        setup:
        def mockRecords = []
        def originalResults = Mock(PaginatedSearchResults)

        def modelMock = Mock(Model) {
            isEmpty() >> false
            filter(*_) >> it
        }

        def recordMock = Mock(DatasetRecord)
        recordMock.getModel() >> modelMock

        7.times { mockRecords <<  recordMock }
        originalResults.getPage() >> mockRecords
        originalResults.getPageNumber() >> 1
        originalResults.getTotalSize() >> 7
        originalResults.getPageSize() >> 10
        catalogManagerMock.findRecord(*_) >>> originalResults

        expect:
        def results = service.getDatasetRecords(new DatasetPaginatedSearchParams(vf))
        results.getPage().size() == 7
        results.getPageSize() == 10
        results.getTotalSize() == 7
        results.getPageNumber() == 1
    }

    def "getDatasets() returns an empty set when there are no datasets in that repository"() {
        setup:
        service.setRepository(systemRepo)
        systemConn.add(Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_no-records.trig"), "", RDFFormat.TRIG)))

        expect:
        service.getDatasets("system").size() == 0
    }

    def "getDatasets() returns an empty set when there are no datasets in the local catalog in that repository, but there are other datasets in that repository"() {
        setup:
        service.setRepository(systemRepo)
        systemConn.add(Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_no-catalog-records.trig"), "", RDFFormat.TRIG)))

        expect:
        service.getDatasets("system").size() == 0
    }

    def "getDatasets() returns a set with #size elements in the #repo repo"() {
        setup:
        service.setRepository(systemRepo)
        systemConn.add(Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG)))
        testConn.add(Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG)))

        expect:
        service.getDatasets(repo).size() == size

        where:
        repo | size
        "system" | numSystemDS
        "test" | numTestDS
    }

    def "createDataset returns the correct DatasetRecord"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset1")
        def dataset = dsFactory.createNew(datasetIRI)
        def ontologyRecordStr = "http://text.com/ontology/record"
        def ontologyBranchStr = "http://text.com/ontology/branch"
        def ontologyCommitStr = "http://text.com/ontology/commit"
        def identifier = new OntologyIdentifier(ontologyRecordStr, ontologyBranchStr, ontologyCommitStr, vf, mf)
        def recordIRI = vf.createIRI("http://test.com/record1")
        def record = dsRecFactory.createNew(recordIRI)
        record.setDataset(dataset)
        record.setOntology(Collections.singleton(identifier.getNode()))

        def config = new DatasetRecordConfig.DatasetRecordBuilder("Test Dataset", [] as Set, "system")
                .dataset(datasetIRI.stringValue())
                .ontology(identifier)
                .build()

        1 * catalogManagerMock.createRecord(config, _ as DatasetRecordFactory) >> record

        when:
        def datasetRecord = service.createDataset(config)

        then:
        datasetRecord.getResource() == recordIRI
        datasetRecord.getDataset_resource() != Optional.empty()
        datasetRecord.getDataset_resource().get() == datasetIRI
        !datasetRecord.getDataset().isPresent()
        datasetRecord.getOntology().size() == 1
    }

    def "createDataset adds the Dataset model to the repo"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset1")
        def dataset = dsFactory.createNew(datasetIRI)
        def recordIRI = vf.createIRI("http://test.com/record1")
        def record = dsRecFactory.createNew(recordIRI)

        // Mock Record Creation
        record.setDataset(dataset)
        def config = new DatasetRecordConfig.DatasetRecordBuilder("Test Dataset", [] as Set, "system")
                .dataset(datasetIRI.stringValue())
                .build()
        1 * catalogManagerMock.createRecord(config, _ as DatasetRecordFactory) >> record

        when:
        service.createDataset(config)

        then:
        1 * catalogManagerMock.addRecord(localCatalog, record) >> { args ->
            DatasetRecord datasetRecord = args[1]
            assert datasetRecord.getDataset_resource().isPresent()
            assert !datasetRecord.getDataset().isPresent()
        }
        1 * connMock.add(_ as Model, datasetIRI) >> { args ->
            Model model = args[0]
            assert model.contains(datasetIRI, vf.createIRI(Resource.type_IRI), vf.createIRI(Dataset.TYPE))
            assert model.contains(datasetIRI, vf.createIRI(Dataset.systemDefaultNamedGraph_IRI), null)
        }
    }

    def "createDataset adds the Dataset model to a non-system repo"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset1")
        def dataset = dsFactory.createNew(datasetIRI)
        def recordIRI = vf.createIRI("http://test.com/record1")
        def record = dsRecFactory.createNew(recordIRI)

        def testRepo = Mock(Repository)
        def testConn = Mock(RepositoryConnection)
        def testResults = Mock(RepositoryResult)

        // Mock Record Creation
        record.setDataset(dataset)
        def config = new DatasetRecordConfig.DatasetRecordBuilder("Test Dataset", [] as Set, "test")
                .dataset(datasetIRI.stringValue())
                .build()

        catalogManagerMock.createRecord(config, _ as DatasetRecordFactory) >> record
        testConn.getStatements(*_) >> testResults
        testResults.hasNext() >> false

        when:
        service.createDataset(config)

        then:
        1 * repoManagerMock.getRepository("test") >> Optional.of(testRepo)
        1 * catalogManagerMock.addRecord(localCatalog, record)
        2 * testRepo.getConnection() >> testConn
        1 * testConn.add(_ as Model, datasetIRI) >> { args ->
            Model model = args[0]
            model.contains(datasetIRI, vf.createIRI(Resource.TYPE), vf.createIRI(Dataset.TYPE))
            model.contains(datasetIRI, vf.createIRI(Dataset.systemDefaultNamedGraph_IRI), null)
        }
    }

    def "createDataset creates the DatasetRecord if the dataset already exists in another repo"() {
        setup:
        def repo = "system"
        def datasetIRI = vf.createIRI("http://test.com/dataset1")
        def dataset = dsFactory.createNew(datasetIRI)
        def recordIRI = vf.createIRI("http://test.com/record1")
        def record = dsRecFactory.createNew(recordIRI)

        // Mock Record Creation
        record.setDataset(dataset)
        def config = new DatasetRecordConfig.DatasetRecordBuilder("Test Dataset", [] as Set, repo)
                .dataset(datasetIRI.stringValue())
                .build()

        catalogManagerMock.createRecord(config, _ as DatasetRecordFactory) >> record
        resultsMock.hasNext() >>> [false, true, false]
        resultsMock.next() >>> [
                vf.createStatement(recordIRI, datasetPred, datasetIRI),
                vf.createStatement(recordIRI, repoPred, vf.createLiteral("someOtherRepo"))
        ]

        when:
        service.createDataset(config)

        then:
        1 * catalogManagerMock.addRecord(localCatalog, record)
        1 * connMock.add(_ as Model, datasetIRI) >> { args ->
            Model model = args[0]
            model.contains(datasetIRI, vf.createIRI(Resource.TYPE), vf.createIRI(Dataset.TYPE))
            model.contains(datasetIRI, vf.createIRI(Dataset.systemDefaultNamedGraph_IRI), null)
        }
    }

    def "createDataset throws an exception if the dataset already exists in the specified repo"() {
        setup:
        def repo = "system"
        def datasetIRI = vf.createIRI("http://test.com/dataset1")
        def dataset = dsFactory.createNew(datasetIRI)
        def recordIRI = vf.createIRI("http://test.com/record1")
        def record = dsRecFactory.createNew(recordIRI)

        // Mock Record Creation
        record.setDataset(dataset)
        def config = new DatasetRecordConfig.DatasetRecordBuilder("Test Dataset", [] as Set, repo)
                .dataset(datasetIRI.stringValue())
                .build()

        catalogManagerMock.createRecord(config, _ as DatasetRecordFactory) >> record
        resultsMock.hasNext() >>> [true, true, false]
        resultsMock.next() >>> [
                vf.createStatement(recordIRI, datasetPred, datasetIRI),
                vf.createStatement(recordIRI, repoPred, vf.createLiteral(repo))
        ]

        when:
        service.createDataset(config)

        then:
        0 * catalogManagerMock.addRecord(localCatalog, record)
        thrown(IllegalArgumentException)
    }

    def "createDataset throws an exception if the dataset repository does not exist"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset1")
        def config = new DatasetRecordConfig.DatasetRecordBuilder("Test Dataset", [] as Set, "test")
                .dataset(datasetIRI.stringValue())
                .build()

        when:
        service.createDataset(config)

        then:
        1 * repoManagerMock.getRepository("test") >> Optional.empty()
        0 * catalogManagerMock.createRecord(*_)
        0 * catalogManagerMock.addRecord(*_)
        thrown(IllegalArgumentException)
    }

    def "deleteDataset() throws an Exception if the DatasetRecord does not exist"() {
        setup:
        def repo = "system"
        def datasetIRI = vf.createIRI("http://test.com/dataset1")

        resultsMock.hasNext() >> false

        when:
        service.deleteDataset(datasetIRI, repo)

        then:
        thrown(IllegalArgumentException)
    }

    def "deleteDataset() calls removeRecord() to delete the DatasetRecord"() {
        setup:
        def repo = "system"
        resultsMock.hasNext() >> true
        resultsMock.next() >> vf.createStatement(recordIRI, datasetPred, datasetIRI)


        when:
        def result = service.deleteDataset(datasetIRI, repo)

        then:
        result.get() == record
        1 * catalogManagerMock.removeRecord(localCatalog, recordIRI, dsRecFactory) >> Optional.of(record)
    }

    def "deleteDataset() correctly removes DatasetRecord, Dataset, and associated graphs in a #repo repository"() {
        setup:
        def testRecord = bootstrapCatalog(testDatasetIRI, testRecordIRI, repo)
        1 * catalogManagerMock.removeRecord(!null, testRecordIRI, !null) >> Optional.of(testRecord)
        testConn.add(Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG)))
        dynamicConn = repos.get(repo).getConnection()

        when:
        def result = service.deleteDataset(testDatasetIRI, repo)

        then:
        // Mock Verifications
        result.get() == testRecord
        repoManagerMock.getRepository("system") >> Optional.of(systemRepo)
        // Assertions
        !dynamicConn.getStatements(testDatasetIRI, null, null).hasNext()
        deletedGraphs.forEach { assert !dynamicConn.getStatements(null, null, null, it).hasNext() }

        where:
        repo | testDatasetIRI | testRecordIRI
        "system" | datasetsInFile[1] | recordsInFile[1]
        "system" | datasetsInFile[2] | recordsInFile[2]
        "test" | datasetsInFile[5] | recordsInFile[5]

        // Named graphs that should have been deleted after test
        deletedGraphs << [
                ( defaultNamedGraphsPerDS[1] + namedGraphsPerDS[1] + sysDefNamedGraphsPerDS[1] ),
                ( defaultNamedGraphsPerDS[2] + namedGraphsPerDS[2] + sysDefNamedGraphsPerDS[2] ),
                ( defaultNamedGraphsPerDS[5] + namedGraphsPerDS[5] + sysDefNamedGraphsPerDS[5] )
        ]
    }

    def "safeDeleteDataset() correctly removes DatasetRecord, Dataset, and associated graphs in a #repo repository for #datasetIRI"() {
        setup:
        def testRecord = bootstrapCatalog(testDatasetIRI, testRecordIRI, repo)
        1 * catalogManagerMock.removeRecord(!null, testRecordIRI, !null) >> Optional.of(testRecord)
        testConn.add(Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG)))
        dynamicConn = repos.get(repo).getConnection()

        when:
        def result = service.safeDeleteDataset(testDatasetIRI, repo)

        then:
        // Mock Verifications
        result.get() == testRecord
        repoManagerMock.getRepository("system") >> Optional.of(systemRepo)
        // Assertions
        !dynamicConn.getStatements(testDatasetIRI, null, null).hasNext()
        deletedGraphs.forEach   { assert !dynamicConn.getStatements(null, null, null, it).hasNext() }
        remainingGraphs.forEach { assert dynamicConn.getStatements(null, null, null, it).hasNext() }

        where:
        repo | testDatasetIRI | testRecordIRI
        "system" | datasetsInFile[1] | recordsInFile[1]
        "system" | datasetsInFile[2] | recordsInFile[2]
        "system" | datasetsInFile[3] | recordsInFile[3]
        "test" | datasetsInFile[5] | recordsInFile[5]
        "test" | datasetsInFile[6] | recordsInFile[6]

        // Named graphs that should have been deleted after test
        deletedGraphs << [
                ( defaultNamedGraphsPerDS[1] + namedGraphsPerDS[1] + sysDefNamedGraphsPerDS[1] ),
                ( defaultNamedGraphsPerDS[2] + namedGraphsPerDS[2] + sysDefNamedGraphsPerDS[2] ),
                [ vf.createIRI("http://matonto.org/dataset/test3/graph1"), vf.createIRI("http://matonto.org/dataset/test3/graph2"), vf.createIRI("http://matonto.org/dataset/test3/graph3") ],
                ( defaultNamedGraphsPerDS[5] + namedGraphsPerDS[5] + sysDefNamedGraphsPerDS[5] ),
                ( defaultNamedGraphsPerDS[6] + namedGraphsPerDS[6] + sysDefNamedGraphsPerDS[6] )
        ]

        // Named graphs that should be in repo after test
        remainingGraphs << [
                [],
                [],
                [ vf.createIRI("http://matonto.org/dataset/test3/graph4"), vf.createIRI("http://matonto.org/dataset/test3/graph5") ],
                [],
                []
        ]
    }

    def "clearDataset() correctly removes associated graphs in a #repo repository"() {
        setup:
        def testRecord = bootstrapCatalog(testDatasetIRI, testRecordIRI, repo)
        1 * catalogManagerMock.getRecord(!null, testRecordIRI, !null) >> Optional.of(testRecord)
        testConn.add(Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG)))
        dynamicConn = repos.get(repo).getConnection()

        when:
        service.clearDataset(testDatasetIRI, repo)

        then:
        // Mock Verification
        repoManagerMock.getRepository("system") >> Optional.of(systemRepo)
        0 * catalogManagerMock.removeRecord(localCatalog, testRecordIRI)
        // Assertions
        dynamicConn.getStatements(testDatasetIRI, null, null).hasNext()
        dynamicConn.getStatements(testDatasetIRI, sysDefNgPred, null).hasNext()
        !dynamicConn.getStatements(testDatasetIRI, defNamedGraphPred, null).hasNext()
        !dynamicConn.getStatements(testDatasetIRI, namedGraphPred, null).hasNext()
        deletedGraphs.forEach { assert !dynamicConn.getStatements(null, null, null, it).hasNext() }

        where:
        repo | testDatasetIRI | testRecordIRI
        "system" | datasetsInFile[1] | recordsInFile[1]
        "system" | datasetsInFile[2] | recordsInFile[2]
        "test" | datasetsInFile[5] | recordsInFile[5]

        // Named graphs that should have been deleted after test
        deletedGraphs << [
                ( defaultNamedGraphsPerDS[1] + namedGraphsPerDS[1] + sysDefNamedGraphsPerDS[1] ),
                ( defaultNamedGraphsPerDS[2] + namedGraphsPerDS[2] + sysDefNamedGraphsPerDS[2] ),
                ( defaultNamedGraphsPerDS[5] + namedGraphsPerDS[5] + sysDefNamedGraphsPerDS[5] )
        ]
    }

    def "safeClearDataset() correctly removes associated graphs in a #repo repository for #datasetIRI"() {
        setup:
        def testRecord = bootstrapCatalog(testDatasetIRI, testRecordIRI, repo)
        1 * catalogManagerMock.getRecord(!null, testRecordIRI, !null) >> Optional.of(testRecord)
        testConn.add(Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG)))
        dynamicConn = repos.get(repo).getConnection()

        when:
        service.safeClearDataset(testDatasetIRI, repo)

        then:
        // Mock Verifications
        repoManagerMock.getRepository("system") >> Optional.of(systemRepo)
        0 * catalogManagerMock.removeRecord(localCatalog, testRecordIRI)
        // Assertions
        dynamicConn.getStatements(testDatasetIRI, null, null).hasNext()
        dynamicConn.getStatements(testDatasetIRI, sysDefNgPred, null).hasNext()
        !dynamicConn.getStatements(testDatasetIRI, defNamedGraphPred, null).hasNext()
        !dynamicConn.getStatements(testDatasetIRI, namedGraphPred, null).hasNext()
        deletedGraphs.forEach   { assert !dynamicConn.getStatements(null, null, null, it).hasNext() }
        remainingGraphs.forEach { assert dynamicConn.getStatements(null, null, null, it).hasNext() }

        where:
        repo | testDatasetIRI | testRecordIRI
        "system" | datasetsInFile[1] | recordsInFile[1]
        "system" | datasetsInFile[2] | recordsInFile[2]
        "system" | datasetsInFile[3] | recordsInFile[3]
        "test" | datasetsInFile[5] | recordsInFile[5]
        "test" | datasetsInFile[6] | recordsInFile[6]

        // Named graphs that should have been deleted after test
        deletedGraphs << [
                ( defaultNamedGraphsPerDS[1] + namedGraphsPerDS[1] + sysDefNamedGraphsPerDS[1] ),
                ( defaultNamedGraphsPerDS[2] + namedGraphsPerDS[2] + sysDefNamedGraphsPerDS[2] ),
                [ vf.createIRI("http://matonto.org/dataset/test3/graph1"), vf.createIRI("http://matonto.org/dataset/test3/graph2"), vf.createIRI("http://matonto.org/dataset/test3/graph3") ],
                ( defaultNamedGraphsPerDS[5] + namedGraphsPerDS[5] + sysDefNamedGraphsPerDS[5] ),
                ( defaultNamedGraphsPerDS[6] + namedGraphsPerDS[6] + sysDefNamedGraphsPerDS[6] )
        ]

        // Named graphs that should be in repo after test
        remainingGraphs << [
                [],
                [],
                [ vf.createIRI("http://matonto.org/dataset/test3/graph4"), vf.createIRI("http://matonto.org/dataset/test3/graph5") ],
                [],
                []
        ]
    }

    def "getConnection(dataset, repository) returns a DatasetConnection over the correct dataset and repo"() {
        setup:
        def repo = "system"
        def datasetIRI = datasetsInFile[1]
        def recordIRI = vf.createIRI("http://test.com/record1")
        mockRetrieveRecord(datasetIRI, repo, recordIRI)

        when:
        def dsConn = service.getConnection(datasetIRI, repo)

        then:
        dsConn.getDataset() == datasetIRI
        dsConn.getRepositoryId() == repo
    }

    def "getConnection(dataset, repository) throws an Exception if the DatasetRecord does not exist"() {
        setup:
        def repo = "system"
        def datasetIRI = vf.createIRI("http://test.com/dataset1")

        resultsMock.hasNext() >> false

        when:
        service.getConnection(datasetIRI, repo)

        then:
        0 * catalogManagerMock.getRecord(*_)
        thrown(IllegalArgumentException)
    }

    def "getConnection(record) throws an Exception if the DatasetRecord does not exist"() {
        setup:
        def recordIRI = vf.createIRI("http://test.com/record/dataset1")

        when:
        service.getConnection(recordIRI)

        then:
        1 * catalogManagerMock.getRecord(*_) >> Optional.empty()
        thrown(IllegalArgumentException)
    }

    private bootstrapCatalog(IRI datasetIRI, IRI recordIRI, String repo = "system") {
        def dataset = dsFactory.createNew(datasetIRI)
        def record = dsRecFactory.createNew(recordIRI)
        record.setDataset(dataset)
        record.setRepository(repo)

        service.setRepository(systemRepo)

        systemConn.add(Values.matontoModel(
                Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG)))
        
        return record
    }

    private mockRetrieveRecord(datasetIRI, repo, recordIRI) {
        def dataset = dsFactory.createNew(datasetIRI)
        resultsMock.hasNext() >> true
        resultsMock.next() >> vf.createStatement(recordIRI, datasetPred, datasetIRI)

        def record = dsRecFactory.createNew(recordIRI)
        record.setDataset(dataset)
        record.setRepository(repo)

        return record
    }
}