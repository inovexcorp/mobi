/*-
 * #%L
 * com.mobi.etl.rdf
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.dataset.api.DatasetConnection
import com.mobi.dataset.api.DatasetManager
import com.mobi.etl.api.config.rdf.export.RDFExportConfig
import com.mobi.repository.api.OsgiRepository
import org.apache.commons.io.output.NullOutputStream
import org.eclipse.rdf4j.model.impl.DynamicModelFactory
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory
import org.eclipse.rdf4j.repository.RepositoryConnection
import org.eclipse.rdf4j.repository.RepositoryResult
import org.eclipse.rdf4j.rio.RDFFormat
import spock.lang.Specification

class RDFExportSpec extends Specification {
    def service = new RDFExportServiceImpl()
    def vf = new ValidatingValueFactory()
    def mf = new DynamicModelFactory();

    def repoId = "test"
    def datasetId = vf.createIRI("http://test.com/dataset-record")
    def s = "http://test.com/s"
    def p = "http://test.com/p"
    def oIRI = "http://test.com/o"
    def oLit = "o"
    def testFile = new File(this.getClass().getResource("/exporter/testFile.trig").toURI())
    def testFileWithoutQuads = new File(this.getClass().getResource("/exporter/testFile.ttl").toURI())
    def invalidFile = new File(this.getClass().getResource("/exporter/testFile.txt").toURI())

    def datasetManager = Mock(DatasetManager)
    def repo = Mock(OsgiRepository)
    def conn = Mock(RepositoryConnection)
    def result = Mock(RepositoryResult)
    def datasetConn = Mock(DatasetConnection)

    def setup() {
        testFile.setWritable(true)
        testFileWithoutQuads.setWritable(true)
        invalidFile.setWritable(true)

        repo.getRepositoryID() >> repoId
        repo.getConnection() >> conn
        conn.getStatements(*_) >> result
        result.iterator() >> mf.createEmptyModel().iterator()
        datasetManager.getConnection(datasetId) >> datasetConn
        datasetManager.getConnection(!datasetId) >> {throw new IllegalArgumentException()}
        datasetConn.getStatements(*_) >> result
        datasetConn.getDefaultNamedGraphs() >> result
        datasetConn.getNamedGraphs() >> result
        datasetConn.getSystemDefaultNamedGraph() >> vf.createIRI("http://test.com/system-default")

        service.addRepository(repo)
    }

    def "Export File from Repository without restrictions"() {
        setup:
        def config = new RDFExportConfig.Builder(new NullOutputStream(), RDFFormat.TRIG).build()

        when:
        service.export(config, repoId)

        then:
        1 * conn.getStatements(null, null, null) >> result
    }

    def "Export File from Repository with restrictions and only subj"() {
        setup:
        def config = new RDFExportConfig.Builder(new NullOutputStream(), RDFFormat.TRIG).subj(s).build()

        when:
        service.export(config, repoId)

        then:
        1 * conn.getStatements(vf.createIRI(s), null, null) >> result
    }

    def "Export File from Repository with restrictions and only pred"() {
        setup:
        def config = new RDFExportConfig.Builder(new NullOutputStream(), RDFFormat.TRIG).pred(p).build()

        when:
        service.export(config, repoId)

        then:
        1 * conn.getStatements(null, vf.createIRI(p), null) >> result
    }

    def "Export File from Repository with restrictions and both object IRI and Lit"() {
        setup:
        def config = new RDFExportConfig.Builder(new NullOutputStream(), RDFFormat.TRIG).objIRI(oIRI).objLit(oLit).build()

        when:
        service.export(config, repoId)

        then:
        1 * conn.getStatements(null, null, vf.createIRI(oIRI)) >> result
    }

    def "Export File from Repository with restrictions and only object Lit"() {
        setup:
        def config = new RDFExportConfig.Builder(new NullOutputStream(), RDFFormat.TRIG).objLit(oLit).build()

        when:
        service.export(config, repoId)

        then:
        1 * conn.getStatements(null, null, vf.createLiteral(oLit)) >> result
    }

    def "Throws exception if repository does not exist"() {
        setup:
        def config = new RDFExportConfig.Builder(new NullOutputStream(), RDFFormat.TRIG).build()

        when:
        service.export(config, "missing")

        then:
        thrown IllegalArgumentException
    }
}
