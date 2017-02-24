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
import org.matonto.dataset.ontology.dataset.DatasetFactory
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory
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
    def testIRI = vf.createIRI("http://test.com/1")
    def memRepo

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

        catalogManagerMock.getLocalCatalogIRI() >> vf.createIRI("http://matonto.org/test/catalog-local")
    }

    def "getDatasetRecord returns the correct DatasetRecord when the dataset exists"() {
        setup:
        def datasetIri = vf.createIRI("http://matonto.org/dataset/test")
        def dataset = dsFactory.createNew(datasetIri)

        def recordIri = vf.createIRI("http://matonto.org/record/dataset/test")
        def record = dsRecFactory.createNew(recordIri)
        record.setDataset(dataset)

        resultsMock.hasNext() >> true
        resultsMock.next() >> vf.createStatement(recordIri, testIRI, datasetIri)
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

        expect:
        service.listDatasets().size() == 0
    }

    def "listDatasets returns a non-empty set when there are only databases"() {
        setup:
        service.setRepository(memRepo)
        def conn = memRepo.getConnection()
        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_only-ds-records.trig"), "", RDFFormat.TRIG))
        conn.add(catalogData)
        def results = service.listDatasets()

        expect:
        results.size() == 2
        results.contains(vf.createIRI("http://matonto.org/dataset/test1"))
        results.contains(vf.createIRI("http://matonto.org/dataset/test2"))
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
    }

//    def "createDataset stores the DatasetRecord correctly"() {
//        setup:
//        def datasetIRI = vf.createIRI("http://test.com/dataset1")
//        def dataset = dsFactory.createNew(datasetIRI)
//        def recordIRI = vf.createIRI("http://test.com/record1")
//        def record = dsRecFactory.createNew(recordIRI)
//        record.setDataset(dataset)
//
//        def config = new DatasetRecordConfig.DatasetRecordBuilder("Test Dataset", [] as Set, "system")
//                .dataset(datasetIRI.stringValue())
//                .build()
//
//        1 * catalogManagerMock.createRecord(config, _ as DatasetRecordFactory) >> record
//
//        service.setRepository(memRepo)
//        def conn = memRepo.getConnection()
//        def catalogData = Values.matontoModel(Rio.parse(this.getClass().getResourceAsStream("/test-catalog_no-records.trig"), "", RDFFormat.TRIG))
//        conn.add(catalogData)
//
//        when:
//        service.createDataset(config)
//
//        then:
//        conn.getStatements(recordIRI, vf.createIRI(DatasetRecord.dataset_IRI), datasetIRI).hasNext()
//    }
}