/*-
 * #%L
 * com.mobi.dataset.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
package com.mobi.dataset.impl

import com.mobi.catalog.api.PaginatedSearchResults
import com.mobi.catalog.api.RecordManager
import com.mobi.catalog.config.CatalogConfigProvider
import com.mobi.dataset.api.DatasetUtilsService
import com.mobi.dataset.ontology.dataset.Dataset
import com.mobi.dataset.ontology.dataset.DatasetRecord
import com.mobi.dataset.pagination.DatasetPaginatedSearchParams
import com.mobi.jaas.api.ontologies.usermanagement.User
import com.mobi.repository.api.OsgiRepository
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper
import org.eclipse.rdf4j.model.IRI
import org.eclipse.rdf4j.model.Model
import org.eclipse.rdf4j.repository.RepositoryConnection
import org.eclipse.rdf4j.repository.RepositoryResult
import org.eclipse.rdf4j.repository.sail.SailRepository
import org.eclipse.rdf4j.rio.RDFFormat
import org.eclipse.rdf4j.rio.Rio
import org.eclipse.rdf4j.sail.memory.MemoryStore
import org.mockito.Mockito
import spock.lang.Shared
import spock.lang.Specification

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.*

class SimpleDatasetManagerSpec extends Specification {

    def service = new SimpleDatasetManager()

    // Services
    @Shared
    def vf = getValueFactory()
    def mf = getModelFactory()
    def dsFactory = getRequiredOrmFactory(Dataset.class)
    def dsRecFactory = getRequiredOrmFactory(DatasetRecord.class)
    def userFactory = getRequiredOrmFactory(User.class)

    // Mocks
    def configProviderMock = Mock(CatalogConfigProvider)
    def recordManagerMock = Mock(RecordManager)
    def dsUtilsService = Mock(DatasetUtilsService)
    def repositoryMock = Mock(OsgiRepository)
    def connMock = Mock(RepositoryConnection)
    def resultsMock = Mockito.mock(RepositoryResult.class)

    // Objects
    def localCatalog = vf.createIRI("http://mobi.com/test/catalog-local")
    def datasetPred = vf.createIRI(DatasetRecord.dataset_IRI)
    def repoPred = vf.createIRI(DatasetRecord.repository_IRI)
    def recordIRI = vf.createIRI("http://test.com/record1")
    def userIRI = vf.createIRI("http://test.com/user")
    def systemRepo
    def testRepo
    def systemConn
    def testConn
    def repos = [ : ]
    IRI datasetIRI
    def dataset
    def record
    def user
    
    @Shared
    numSystemDS = 5

    @Shared
    numTestDS = 3

    @Shared
    datasetsInFile = [
            [ "filler" ],
            vf.createIRI("http://mobi.com/dataset/test1"),
            vf.createIRI("http://mobi.com/dataset/test2"),
            vf.createIRI("http://mobi.com/dataset/test3"),
            vf.createIRI("http://mobi.com/dataset/test4"),
            vf.createIRI("http://mobi.com/dataset/test5"),
            vf.createIRI("http://mobi.com/dataset/test6"),
            vf.createIRI("http://mobi.com/dataset/test7"),
            vf.createIRI("http://mobi.com/dataset/test8")
    ]

    @Shared
    recordsInFile = [
            [ "filler" ],
            vf.createIRI("http://mobi.com/record/dataset/test1"),
            vf.createIRI("http://mobi.com/record/dataset/test2"),
            vf.createIRI("http://mobi.com/record/dataset/test3"),
            vf.createIRI("http://mobi.com/record/dataset/test4"),
            vf.createIRI("http://mobi.com/record/dataset/test5"),
            vf.createIRI("http://mobi.com/record/dataset/test6"),
            vf.createIRI("http://mobi.com/record/dataset/test7"),
            vf.createIRI("http://mobi.com/record/dataset/test8")
    ]

    def setup() {
        systemRepo = new MemoryRepositoryWrapper()
        systemRepo.setDelegate(new SailRepository(new MemoryStore()));
        systemConn = systemRepo.getConnection()

        testRepo = new MemoryRepositoryWrapper()
        testRepo.setDelegate(new SailRepository(new MemoryStore()))
        testConn = testRepo.getConnection()

        repos << [ "system": systemRepo ]
        repos << [ "test": testRepo ]

        datasetIRI = datasetsInFile[1]
        dataset = dsFactory.createNew(datasetIRI)
        record = dsRecFactory.createNew(recordIRI)
        user = userFactory.createNew(userIRI)

        // Set Services
        injectOrmFactoryReferencesIntoService(service)

        service.configProvider = configProviderMock
        service.recordManager = recordManagerMock
        service.dsUtilsService = dsUtilsService

        // Mock Behavior
        repositoryMock.getConnection() >> connMock
        connMock.getStatements(*_) >> resultsMock
        Mockito.doNothing().when(resultsMock).close()

        configProviderMock.getLocalCatalogIRI() >> localCatalog

        record.setDataset(dataset)
        record.setRepository("system")
    }

    def cleanup() {
        if (systemConn != null) systemConn.close()
        systemRepo.shutDown()
        if (testConn != null) testConn.close()
        testRepo.shutDown()
    }

    def "getDatasetRecord(dataset, repo) returns the correct DatasetRecord when the dataset exists"() {
        setup:
        def repo = "system"
        def datasetIri = vf.createIRI("http://mobi.com/dataset/test")
        def dataset = dsFactory.createNew(datasetIri)
        def recordIri = vf.createIRI("http://mobi.com/record/dataset/test")
        def record = dsRecFactory.createNew(recordIri)
        record.setDataset(dataset)
        record.setRepository(repo)

        Mockito.when(resultsMock.hasNext()).thenReturn(true).thenReturn(true).thenReturn(false)
        Mockito.when(resultsMock.next()).thenReturn(vf.createStatement(recordIri, datasetPred, datasetIri)).thenReturn(vf.createStatement(recordIri, repoPred, vf.createLiteral(repo)))
        1 * recordManagerMock.getRecordOpt(!null, recordIri, !null, connMock) >> Optional.of(record)
        configProviderMock.getRepository() >> repositoryMock
        connMock.contains(*_) >>> [true, true, false]

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
        def datasetIri = vf.createIRI("http://mobi.com/dataset/test")

        resultsMock.hasNext() >> false
        configProviderMock.getRepository() >> repositoryMock

        when:
        def results = service.getDatasetRecord(datasetIri, repo)

        then:
        results == Optional.empty()
    }

    def "getDatasetRecord(dataset, repo) returns the correct DatasetRecord when more than one DatasetRecord points to that Dataset"() {
        setup:
        def repo = "system"
        def datasetIri = vf.createIRI("http://mobi.com/dataset/test")
        def dataset = dsFactory.createNew(datasetIri)
        def recordIri = vf.createIRI("http://mobi.com/record/dataset/test")
        def record = dsRecFactory.createNew(recordIri)
        record.setDataset(dataset)
        record.setRepository(repo)

        Mockito.when(resultsMock.hasNext()).thenReturn(true, true, true, false)
        Mockito.when(resultsMock.next()).thenReturn(
                vf.createStatement(recordIri, datasetPred, datasetIri),
                vf.createStatement(recordIri, repoPred, vf.createLiteral("someOtherRepo")),
                vf.createStatement(recordIri, repoPred, vf.createLiteral(repo)))
        1 * recordManagerMock.getRecordOpt(!null, recordIri, !null, connMock) >> Optional.of(record)
        configProviderMock.getRepository() >> repositoryMock
        connMock.contains(*_) >>> [true, true, true, false]

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
        def datasetIRI = vf.createIRI("http://mobi.com/dataset/test")
        def dataset = dsFactory.createNew(datasetIRI)
        def recordIRI = vf.createIRI("http://mobi.com/record/dataset/test")
        def record = dsRecFactory.createNew(recordIRI)
        record.setDataset(dataset)
        record.setRepository(repo)
        configProviderMock.getRepository() >> repositoryMock

        when:
        def results = service.getDatasetRecord(recordIRI)

        then:
        1 * recordManagerMock.getRecordOpt(*_) >> Optional.of(record)
        results != Optional.empty()
        results.get().getResource() == recordIRI
        results.get().getRepository().get() == "system"
        results.get().getDataset_resource().get() == datasetIRI
    }

    def "getDatasetRecord(record) returns empty optional when the dataset does not exist"() {
        setup:
        def recordIRI = vf.createIRI("http://mobi.com/record/dataset/test")
        configProviderMock.getRepository() >> repositoryMock

        when:
        def results = service.getDatasetRecord(recordIRI)

        then:
        1 * recordManagerMock.getRecordOpt(*_) >> Optional.empty()
        results == Optional.empty()
    }

    def "getDatasetRecords() returns PaginatedSearchResults with a set of DatasetRecords from the repo"() {
        setup:
        def mockRecords = []
        def originalResults = Mock(PaginatedSearchResults)
        configProviderMock.getRepository() >> repositoryMock

        def modelMock = Mock(Model) {
            isEmpty() >> false
            filter(*_) >> it
        }

        def recordMock = Mock(DatasetRecord)
        recordMock.getModel() >> modelMock

        7.times { mockRecords <<  recordMock }
        originalResults.page() >> mockRecords
        originalResults.pageNumber() >> 1
        originalResults.totalSize() >> 7
        originalResults.pageSize() >> 10
        recordManagerMock.findRecord(*_) >>> originalResults

        expect:
        def results = service.getDatasetRecords(new DatasetPaginatedSearchParams(vf))
        results.page().size() == 7
        results.pageSize() == 10
        results.totalSize() == 7
        results.pageNumber() == 1
    }

    def "getDatasets() returns an empty set when there are no datasets in that repository"() {
        setup:
        configProviderMock.getRepository() >> systemRepo
        systemConn.add(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_no-records.trig"), "", RDFFormat.TRIG))

        expect:
        service.getDatasets("system").size() == 0
    }

    def "getDatasets() returns an empty set when there are no datasets in the local catalog in that repository, but there are other datasets in that repository"() {
        setup:
        configProviderMock.getRepository() >> systemRepo
        systemConn.add(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_no-catalog-records.trig"), "", RDFFormat.TRIG))

        expect:
        service.getDatasets("system").size() == 0
    }

    def "getDatasets() returns a set with #size elements in the #repo repo"() {
        setup:
        configProviderMock.getRepository() >> systemRepo
        systemConn.add(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        testConn.add(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG))

        expect:
        service.getDatasets(repo).size() == size

        where:
        repo | size
        "system" | numSystemDS
        "test" | numTestDS
    }

    def "deleteDataset() throws an Exception if the DatasetRecord does not exist"() {
        setup:
        def repo = "system"
        def datasetIRI = vf.createIRI("http://test.com/dataset1")

        resultsMock.hasNext() >> false
        configProviderMock.getRepository() >> repositoryMock

        when:
        service.deleteDataset(datasetIRI, repo, user)

        then:
        thrown(IllegalArgumentException)
    }

    def "deleteDataset() calls removeRecord() to delete the DatasetRecord"() {
        setup:
        def repo = "system"
        Mockito.when(resultsMock.hasNext()).thenReturn(true)
        Mockito.when(resultsMock.next()).thenReturn(vf.createStatement(recordIRI, datasetPred, datasetIRI))
        configProviderMock.getRepository() >> repositoryMock

        when:
        def result = service.deleteDataset(datasetIRI, repo, user)

        then:
        result == record
        1 * recordManagerMock.removeRecord(localCatalog, recordIRI, user, DatasetRecord.class, connMock) >> record
    }

    def "deleteDataset() correctly removes DatasetRecord, Dataset, and associated graphs in a #repo repository"() {
        setup:
        def testRecord = bootstrapCatalog(testDatasetIRI, testRecordIRI, repo)
        1 * recordManagerMock.removeRecord(!null, testRecordIRI, !null, !null, !null) >> testRecord
        testConn.add(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG))

        when:
        def result = service.deleteDataset(testDatasetIRI, repo, user)

        then:
        // Mock Verifications
        result == testRecord
        // Assertions
        1 * dsUtilsService.deleteDataset(testDatasetIRI, repo)

        where:
        repo | testDatasetIRI | testRecordIRI
        "system" | datasetsInFile[1] | recordsInFile[1]
        "system" | datasetsInFile[2] | recordsInFile[2]
        "test" | datasetsInFile[5] | recordsInFile[5]
    }

    def "safeDeleteDataset(Resource, String, User) correctly removes DatasetRecord, Dataset, and associated graphs in a #repo repository for #testDatasetIRI"() {
        setup:
        def testRecord = bootstrapCatalog(testDatasetIRI, testRecordIRI, repo)
        1 * recordManagerMock.removeRecord(!null, testRecordIRI, !null, !null, !null) >> testRecord
        testConn.add(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG))

        when:
        def result = service.safeDeleteDataset(testDatasetIRI, repo, user)

        then:
        // Mock Verifications
        result == testRecord
        // Assertions
        1 * dsUtilsService.safeDeleteDataset(testDatasetIRI, repo)

        where:
        repo | testDatasetIRI | testRecordIRI
        "system" | datasetsInFile[1] | recordsInFile[1]
        "system" | datasetsInFile[2] | recordsInFile[2]
        "system" | datasetsInFile[3] | recordsInFile[3]
        "test" | datasetsInFile[5] | recordsInFile[5]
        "test" | datasetsInFile[6] | recordsInFile[6]
    }
    
    def "safeDeleteDataset(Resource, User) correctly removes DatasetRecord, Dataset, and associated graphs in a #repo repository for #testDatasetIRI"() {
        setup:
        def testRecord = bootstrapCatalog(testDatasetIRI, testRecordIRI, repo)
        1 * recordManagerMock.removeRecord(!null, testRecordIRI, !null, !null, !null) >> testRecord
        testConn.add(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG))

        when:
        service.safeDeleteDataset(testRecordIRI, user)

        then:
        // Assertions
        1 * dsUtilsService.safeDeleteDataset(testDatasetIRI, repo)

        where:
        repo | testDatasetIRI | testRecordIRI
        "system" | datasetsInFile[1] | recordsInFile[1]
        "system" | datasetsInFile[2] | recordsInFile[2]
        "system" | datasetsInFile[3] | recordsInFile[3]
        "test" | datasetsInFile[5] | recordsInFile[5]
        "test" | datasetsInFile[6] | recordsInFile[6]
    }

    def "clearDataset() correctly removes associated graphs in a #repo repository"() {
        setup:
        def testRecord = bootstrapCatalog(testDatasetIRI, testRecordIRI, repo)
        1 * recordManagerMock.getRecordOpt(!null, testRecordIRI, !null, !null) >> Optional.of(testRecord)
        testConn.add(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG))

        when:
        service.clearDataset(testRecordIRI)

        then:
        // Mock Verification
        0 * recordManagerMock.removeRecord(localCatalog, testRecordIRI)
        // Assertions
        1 * dsUtilsService.clearDataset(testDatasetIRI, repo)

        where:
        repo | testDatasetIRI | testRecordIRI
        "system" | datasetsInFile[1] | recordsInFile[1]
        "system" | datasetsInFile[2] | recordsInFile[2]
        "test" | datasetsInFile[5] | recordsInFile[5]
    }

    def "safeClearDataset() correctly removes associated graphs in a #repo repository for #testDatasetIRI"() {
        setup:
        def testRecord = bootstrapCatalog(testDatasetIRI, testRecordIRI, repo)
        1 * recordManagerMock.getRecordOpt(!null, testRecordIRI, !null, !null) >> Optional.of(testRecord)
        testConn.add(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_test-repo-datasets.trig"), "", RDFFormat.TRIG))

        when:
        service.safeClearDataset(testRecordIRI)

        then:
        // Mock Verifications
        0 * recordManagerMock.removeRecord(localCatalog, testRecordIRI)
        // Assertions
        1 * dsUtilsService.safeClearDataset(testDatasetIRI, repo)

        where:
        repo | testDatasetIRI | testRecordIRI
        "system" | datasetsInFile[1] | recordsInFile[1]
        "system" | datasetsInFile[2] | recordsInFile[2]
        "system" | datasetsInFile[3] | recordsInFile[3]
        "test" | datasetsInFile[5] | recordsInFile[5]
        "test" | datasetsInFile[6] | recordsInFile[6]
    }

    def "getConnection(record) throws an Exception if the DatasetRecord does not exist"() {
        setup:
        def recordIRI = vf.createIRI("http://test.com/record/dataset1")
        configProviderMock.getRepository() >> systemRepo

        when:
        service.getConnection(recordIRI)

        then:
        1 * recordManagerMock.getRecordOpt(*_) >> Optional.empty()
        thrown(IllegalArgumentException)
    }

    private bootstrapCatalog(IRI datasetIRI, IRI recordIRI, String repo = "system") {
        def dataset = dsFactory.createNew(datasetIRI)
        def record = dsRecFactory.createNew(recordIRI)
        record.setDataset(dataset)
        record.setRepository(repo)

        configProviderMock.getRepository() >> systemRepo

        systemConn.add(
                Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        
        return record
    }
}
