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
import org.matonto.dataset.ontology.dataset.DatasetFactory
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.orm.conversion.impl.*
import org.matonto.rdf.orm.impl.ThingFactory
import org.matonto.repository.api.Repository
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.base.RepositoryResult
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

    def setup() {
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

        service.setCatalogManager(catalogManagerMock)
        service.setRepository(repositoryMock)
        service.setValueFactory(vf)

        repositoryMock.getConnection() >> connMock
        connMock.getStatements(*_) >> resultsMock

        catalogManagerMock.getLocalCatalogIRI() >> vf.createIRI("http://test.com/localcatalog")
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
}