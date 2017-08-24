/*-
 * #%L
 * org.matonto.etl.rdf
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
package org.matonto.etl.service.rdf.export

import org.apache.commons.io.output.NullOutputStream
import org.matonto.dataset.api.DatasetConnection
import org.matonto.dataset.api.DatasetManager
import org.matonto.etl.api.config.rdf.export.BaseExportConfig
import org.matonto.persistence.utils.api.SesameTransformer
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.matonto.repository.base.RepositoryResult
import org.openrdf.rio.RDFFormat
import spock.lang.Specification

class DatasetExportSpec extends Specification {
    def service = new DatasetExportServiceImpl()
    def vf = SimpleValueFactory.getInstance()
    def mf = LinkedHashModelFactory.getInstance()

    def transformer = Mock(SesameTransformer)
    def datasetManager = Mock(DatasetManager)
    def datasetConn = Mock(DatasetConnection)
    def result = Mock(RepositoryResult)

    def datasetId = "http://test.com/dataset-record"

    def setup() {
        def datasetIRI = vf.createIRI(datasetId)

        transformer.sesameStatement(_) >> { args -> Values.sesameStatement(args[0])}
        result.iterator() >> mf.createModel().iterator()
        datasetManager.getConnection(datasetIRI) >> datasetConn
        datasetManager.getConnection(!datasetIRI) >> {throw new IllegalArgumentException()}
        datasetConn.getStatements(*_) >> result
        datasetConn.getDefaultNamedGraphs() >> result
        datasetConn.getNamedGraphs() >> result
        datasetConn.getSystemDefaultNamedGraph() >> vf.createIRI("http://test.com/system-default")

        service.setDatasetManager(datasetManager)
        service.setTransformer(transformer)
        service.setValueFactory(vf)
    }

    def "Export File from Dataset without restrictions with quads"() {
        setup:
        def config = new BaseExportConfig.Builder(new NullOutputStream(), RDFFormat.TRIG).build()

        when:
        service.export(config, datasetId)

        then:
        2 * datasetConn.getStatements(null, null, null, _) >> result
    }

    def "Export File from Dataset without restrictions without quads"() {
        setup:
        def config = new BaseExportConfig.Builder(new NullOutputStream(), RDFFormat.TURTLE).build()

        when:
        service.export(config, datasetId)

        then:
        1 * datasetConn.getStatements(null, null, null, _) >> result
    }

    def "Throws exception if dataset does not exist"() {
        setup:
        def config = new BaseExportConfig.Builder(new NullOutputStream(), RDFFormat.TRIG).build()

        when:
        service.export(config, "http://test.com/missing")

        then:
        thrown IllegalArgumentException
    }
}