/*-
 * #%L
 * com.mobi.etl.rdf
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
package com.mobi.etl.service.rdf.export

import org.apache.commons.io.output.NullOutputStream
import com.mobi.dataset.api.DatasetConnection
import com.mobi.dataset.api.DatasetManager
import com.mobi.etl.api.config.rdf.export.BaseExportConfig
import org.eclipse.rdf4j.model.impl.DynamicModelFactory
import org.eclipse.rdf4j.model.impl.SimpleValueFactory
import org.eclipse.rdf4j.repository.RepositoryResult
import org.eclipse.rdf4j.rio.RDFFormat
import org.mockito.Mockito
import spock.lang.Specification

class DatasetExportSpec extends Specification {
    def service = new DatasetExportServiceImpl()
    def vf = SimpleValueFactory.getInstance()
    def mf = new DynamicModelFactory()

    def datasetManager = Mock(DatasetManager)
    def datasetConn = Mock(DatasetConnection)
    def result = Mockito.mock(RepositoryResult.class)

    def datasetId = "http://test.com/dataset-record"

    def setup() {
        def datasetIRI = vf.createIRI(datasetId)

        Mockito.doNothing().when(result).close()
        Mockito.when(result.iterator()).thenReturn(mf.createEmptyModel().iterator())

        datasetManager.getConnection(datasetIRI) >> datasetConn
        datasetManager.getConnection(!datasetIRI) >> {throw new IllegalArgumentException()}
        datasetConn.getStatements(*_) >> result
        datasetConn.getDefaultNamedGraphs() >> result
        datasetConn.getNamedGraphs() >> result
        datasetConn.getSystemDefaultNamedGraph() >> vf.createIRI("http://test.com/system-default")

        service.datasetManager = datasetManager
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
