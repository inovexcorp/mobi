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
import org.matonto.dataset.api.builder.DatasetRecordConfig
import org.matonto.dataset.ontology.dataset.Dataset
import org.matonto.dataset.ontology.dataset.DatasetFactory
import org.matonto.dataset.ontology.dataset.DatasetRecord
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory
import org.matonto.exception.MatOntoException
import org.matonto.ontologies.rdfs.Resource
import org.matonto.rdf.api.Model
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.matonto.rdf.orm.conversion.impl.*
import org.matonto.rdf.orm.impl.ThingFactory
import org.matonto.repository.api.Repository
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.base.RepositoryResult
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper
import org.openrdf.repository.sail.SailRepository
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import org.openrdf.sail.memory.MemoryStore
import spock.lang.Specification

class SimpleDatasetManagerSpec extends Specification {

    def service = new SimpleDatasetManager()

    // Services
    def vf = SimpleValueFactory.getInstance()
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

    // Objects
    def localCatalog = vf.createIRI("http://matonto.org/test/catalog-local")
    def datasetPred = vf.createIRI(DatasetRecord.dataset_IRI)
    def namedGraphPred = vf.createIRI(Dataset.namedGraph_IRI)
    def defNamedGraphPred = vf.createIRI(Dataset.defaultNamedGraph_IRI)
    def memRepo
    def conn
    def datasetsInFile = [
            vf.createIRI("http://matonto.org/dataset/test1"),
            vf.createIRI("http://matonto.org/dataset/test2"),
            vf.createIRI("http://matonto.org/dataset/test3"),
            vf.createIRI("http://matonto.org/dataset/test4")
    ]
    def dataset1 = vf.createIRI("http://matonto.org/dataset/test1")
    def dataset2 = vf.createIRI("http://matonto.org/dataset/test2")
    def dataset3 = vf.createIRI("http://matonto.org/dataset/test3")
    def dataset4 = vf.createIRI("http://matonto.org/dataset/test4")

    def setup() {
        memRepo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()))
        memRepo.initialize()

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

        service.setDatasetRecordFactory(dsRecFactory)
        service.setDatasetFactory(dsFactory)

        service.setCatalogManager(catalogManagerMock)
        service.setRepository(repositoryMock)
        service.setValueFactory(vf)

        repositoryMock.getConnection() >> connMock
        connMock.getStatements(*_) >> resultsMock

        catalogManagerMock.getLocalCatalogIRI() >> localCatalog
    }

    def cleanup() {
        if (conn != null) conn.close()
        memRepo.shutDown()
    }

    def "getDatasetRecord returns the correct DatasetRecord when the dataset exists"() {
        setup:
        def datasetIri = vf.createIRI("http://matonto.org/dataset/test")
        def dataset = dsFactory.createNew(datasetIri)

        def recordIri = vf.createIRI("http://matonto.org/record/dataset/test")
        def record = dsRecFactory.createNew(recordIri)
        record.setDataset(dataset)

        resultsMock.hasNext() >> true
        resultsMock.next() >> vf.createStatement(recordIri, datasetPred, datasetIri)
        1 * catalogManagerMock.getRecord(!null, recordIri, !null) >> Optional.of(record)

        when:
        def results = service.getDatasetRecord(datasetIri)

        then:
        results != Optional.empty()
        results.get().getResource() == recordIri
        results.get().getDataset().get().getResource() == datasetIri
    }

    def "getDatasetRecord returns empty optional when the dataset does not exist"() {
        setup:
        def recordIri = vf.createIRI("http://matonto.org/dataset/test")
        resultsMock.hasNext() >> false

        when:
        def results = service.getDatasetRecord(recordIri)

        then:
        results == Optional.empty()
    }

    def "listDatasets returns an empty set when there are no records"() {
        setup:
        service.setRepository(memRepo)
        def conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_no-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)
        conn.close()

        expect:
        service.listDatasets().size() == 0
    }

    def "listDatasets returns the correct resources when there are only databases"() {
        setup:
        service.setRepository(memRepo)
        def conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)
        def results = service.listDatasets()
        conn.close()

        expect:
        results.size() == datasetsInFile.size()
        datasetsInFile.forEach { results.contains(it) }
    }

    def "createDataset returns the correct DatasetRecord"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset1")
        def dataset = dsFactory.createNew(datasetIRI)
        def recordIRI = vf.createIRI("http://test.com/record1")
        def record = dsRecFactory.createNew(recordIRI)
        record.setDataset(dataset)

        def config = new DatasetRecordConfig.DatasetRecordBuilder("Test Dataset", [] as Set, "system")
                .dataset(datasetIRI.stringValue())
                .build()

        1 * catalogManagerMock.createRecord(config, _ as DatasetRecordFactory) >> record

        when:
        def results = service.createDataset(config)

        then:
        results.getResource() == recordIRI
        results.getDataset() != Optional.empty()
        results.getDataset().get().getResource() == datasetIRI
        results.getDataset().get().getSystemDefaultNamedGraph() != null
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
        1 * catalogManagerMock.addRecord(localCatalog, record)
        1 * connMock.add(_ as Model) >> { args ->
            Model model = args[0]
            model.contains(datasetIRI, vf.createIRI(Resource.TYPE), vf.createIRI(Dataset.TYPE))
            model.contains(datasetIRI, vf.createIRI(Dataset.systemDefaultNamedGraph_IRI), null)
        }
    }

    def "deleteDataset() throws an Exception if the DatasetRecord does not exist"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset1")
        resultsMock.hasNext() >> false

        when:
        service.deleteDataset(datasetIRI)

        then:
        thrown(MatOntoException.class)
    }

    def "deleteDataset() calls removeRecord() to delete the DatasetRecord"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset1")
        def recordIRI = vf.createIRI("http://test.com/record1")
        resultsMock.hasNext() >> true
        resultsMock.next() >> vf.createStatement(recordIRI, datasetPred, datasetIRI)

        when:
        service.deleteDataset(datasetIRI)

        then:
        1 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
    }

    def "deleteDataset() uses a RepositoryConnection to remove the dataset object"() {
        setup:
        def datasetIRI = vf.createIRI("http://test.com/dataset1")
        def recordIRI = vf.createIRI("http://test.com/record1")
        resultsMock.hasNext() >> true
        resultsMock.next() >> vf.createStatement(recordIRI, datasetPred, datasetIRI)

        when:
        service.deleteDataset(datasetIRI)

        then:
        1 * connMock.remove(datasetIRI, null, null)
    }

    def "deleteDataset() correctly removes DatasetRecord, Dataset when there are no associated graphs"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test1")

        service.setRepository(memRepo)
        conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)

        when:
        service.deleteDataset(dataset1)

        then:
        1 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
        !conn.getStatements(dataset1, null, null).hasNext()
        conn.getStatements(dataset2, null, null).hasNext()
    }

    def "deleteDataset() correctly removes DatasetRecord, Dataset, and associated graphs"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test2")
        def graph1 = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def graph2 = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def graph3 = vf.createIRI("http://matonto.org/dataset/test2/graph3")

        service.setRepository(memRepo)
        conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)

        when:
        service.deleteDataset(dataset2)

        then:
        1 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
        conn.getStatements(dataset1, null, null).hasNext()
        !conn.getStatements(dataset2, null, null).hasNext()
        !conn.getStatements(null, null, null, graph1).hasNext()
        !conn.getStatements(null, null, null, graph2).hasNext()
        !conn.getStatements(null, null, null, graph3).hasNext()
    }

    def "safeDeleteDataset() correctly removes DatasetRecord, Dataset when there are no associated graphs"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test1")

        service.setRepository(memRepo)
        conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)

        when:
        service.safeDeleteDataset(dataset1)

        then:
        1 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
        !conn.getStatements(dataset1, null, null).hasNext()
        conn.getStatements(dataset2, null, null).hasNext()
    }

    def "safeDeleteDataset() correctly removes DatasetRecord, Dataset, and associated graphs"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test2")
        def graph1 = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def graph2 = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def graph3 = vf.createIRI("http://matonto.org/dataset/test2/graph3")

        service.setRepository(memRepo)
        conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)

        when:
        service.safeDeleteDataset(dataset2)

        then:
        1 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
        conn.getStatements(dataset1, null, null).hasNext()
        !conn.getStatements(dataset2, null, null).hasNext()
        !conn.getStatements(null, null, null, graph1).hasNext()
        !conn.getStatements(null, null, null, graph2).hasNext()
        !conn.getStatements(null, null, null, graph3).hasNext()
    }

    def "safeDeleteDataset() correctly removes only associated graphs that are not used in other datasets"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test3")
        def graph1 = vf.createIRI("http://matonto.org/dataset/test3/graph1")
        def graph2 = vf.createIRI("http://matonto.org/dataset/test3/graph2")
        def graph3 = vf.createIRI("http://matonto.org/dataset/test3/graph3")
        def graph4 = vf.createIRI("http://matonto.org/dataset/test3/graph4")
        def graph5 = vf.createIRI("http://matonto.org/dataset/test3/graph5")

        service.setRepository(memRepo)
        conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)

        when:
        service.safeDeleteDataset(dataset3)

        then:
        1 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
        conn.getStatements(dataset1, null, null).hasNext()
        conn.getStatements(dataset2, null, null).hasNext()
        !conn.getStatements(dataset3, null, null).hasNext()
        conn.getStatements(dataset4, null, null).hasNext()
        !conn.getStatements(null, null, null, graph1).hasNext()
        !conn.getStatements(null, null, null, graph2).hasNext()
        !conn.getStatements(null, null, null, graph3).hasNext()
        conn.getStatements(null, null, null, graph4).hasNext()
        conn.getStatements(null, null, null, graph5).hasNext()
    }

    def "clearDataset() removes nothing when there are no associated graphs"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test1")

        service.setRepository(memRepo)
        conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)

        when:
        service.clearDataset(dataset1)

        then:
        0 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
        conn.getStatements(dataset1, null, null).hasNext()
        conn.getStatements(dataset2, null, null).hasNext()
    }

    def "clearDataset() only removes associated graphs"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test2")
        def graph1 = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def graph2 = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def graph3 = vf.createIRI("http://matonto.org/dataset/test2/graph3")

        service.setRepository(memRepo)
        conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)

        when:
        service.clearDataset(dataset2)

        then:
        0 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
        conn.getStatements(dataset1, null, null).hasNext()
        conn.getStatements(dataset2, null, null).hasNext()
        !conn.getStatements(null, null, null, graph1).hasNext()
        !conn.getStatements(null, null, null, graph2).hasNext()
        !conn.getStatements(null, null, null, graph3).hasNext()
    }

    def "safeClearDataset() removes nothing when there are no associated graphs"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test1")

        service.setRepository(memRepo)
        conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)

        when:
        service.safeClearDataset(dataset1)

        then:
        0 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
        conn.getStatements(dataset1, null, null).hasNext()
        conn.getStatements(dataset2, null, null).hasNext()
        !conn.getStatements(dataset1, namedGraphPred, null).hasNext()
        !conn.getStatements(dataset1, defNamedGraphPred, null).hasNext()
    }

    def "safeClearDataset() correctly removes associated graphs"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test2")
        def graph1 = vf.createIRI("http://matonto.org/dataset/test2/graph1")
        def graph2 = vf.createIRI("http://matonto.org/dataset/test2/graph2")
        def graph3 = vf.createIRI("http://matonto.org/dataset/test2/graph3")

        service.setRepository(memRepo)
        conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)

        when:
        service.safeClearDataset(dataset2)

        then:
        0 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
        conn.getStatements(dataset1, null, null).hasNext()
        conn.getStatements(dataset2, null, null).hasNext()
        !conn.getStatements(null, null, null, graph1).hasNext()
        !conn.getStatements(null, null, null, graph2).hasNext()
        !conn.getStatements(null, null, null, graph3).hasNext()
        !conn.getStatements(dataset2, namedGraphPred, null).hasNext()
        !conn.getStatements(dataset2, defNamedGraphPred, null).hasNext()
    }

    def "safeClearDataset() correctly removes only associated graphs that are not used in other datasets"() {
        setup:
        def recordIRI = vf.createIRI("http://matonto.org/record/dataset/test3")
        def graph1 = vf.createIRI("http://matonto.org/dataset/test3/graph1")
        def graph2 = vf.createIRI("http://matonto.org/dataset/test3/graph2")
        def graph3 = vf.createIRI("http://matonto.org/dataset/test3/graph3")
        def graph4 = vf.createIRI("http://matonto.org/dataset/test3/graph4")
        def graph5 = vf.createIRI("http://matonto.org/dataset/test3/graph5")

        service.setRepository(memRepo)
        conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)

        when:
        service.safeClearDataset(dataset3)

        then:
        0 * catalogManagerMock.removeRecord(localCatalog, recordIRI)
        conn.getStatements(dataset1, null, null).hasNext()
        conn.getStatements(dataset2, null, null).hasNext()
        conn.getStatements(dataset3, null, null).hasNext()
        conn.getStatements(dataset4, null, null).hasNext()
        !conn.getStatements(null, null, null, graph1).hasNext()
        !conn.getStatements(null, null, null, graph2).hasNext()
        !conn.getStatements(null, null, null, graph3).hasNext()
        conn.getStatements(null, null, null, graph4).hasNext()
        conn.getStatements(null, null, null, graph5).hasNext()
        !conn.getStatements(dataset3, namedGraphPred, null).hasNext()
        !conn.getStatements(dataset3, defNamedGraphPred, null).hasNext()
        conn.getStatements(dataset4, defNamedGraphPred, graph4).hasNext()
        conn.getStatements(dataset4, namedGraphPred, graph5).hasNext()
    }
}