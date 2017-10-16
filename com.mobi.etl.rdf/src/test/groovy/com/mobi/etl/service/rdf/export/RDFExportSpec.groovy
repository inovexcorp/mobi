/*-
 * #%L
 * com.mobi.etl.rdf
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
import com.mobi.etl.api.config.rdf.export.RDFExportConfig
import com.mobi.persistence.utils.api.SesameTransformer
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory
import com.mobi.rdf.core.utils.Values
import com.mobi.repository.api.DelegatingRepository
import com.mobi.repository.api.RepositoryConnection
import com.mobi.repository.base.RepositoryResult
import org.openrdf.rio.RDFFormat
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification

class RDFExportSpec extends Specification {
    def service = new RDFExportServiceImpl()
    def vf = SimpleValueFactory.getInstance()
    def mf = LinkedHashModelFactory.getInstance()

    def repoId = "test"
    def datasetId = vf.createIRI("http://test.com/dataset-record")
    def s = "http://test.com/s"
    def p = "http://test.com/p"
    def oIRI = "http://test.com/o"
    def oLit = "o"
    def testFile = new ClassPathResource("exporter/testFile.trig").getFile()
    def testFileWithoutQuads = new ClassPathResource("exporter/testFile.ttl").getFile()
    def invalidFile = new ClassPathResource("exporter/testFile.txt").getFile()

    def transformer = Mock(SesameTransformer)
    def datasetManager = Mock(DatasetManager)
    def repo = Mock(DelegatingRepository)
    def conn = Mock(RepositoryConnection)
    def result = Mock(RepositoryResult)
    def datasetConn = Mock(DatasetConnection)

    def setup() {
        testFile.setWritable(true)
        testFileWithoutQuads.setWritable(true)
        invalidFile.setWritable(true)

        transformer.sesameStatement(_) >> { args -> Values.sesameStatement(args[0])}
        repo.getRepositoryID() >> repoId
        repo.getConnection() >> conn
        conn.getStatements(*_) >> result
        result.iterator() >> mf.createModel().iterator()
        datasetManager.getConnection(datasetId) >> datasetConn
        datasetManager.getConnection(!datasetId) >> {throw new IllegalArgumentException()}
        datasetConn.getStatements(*_) >> result
        datasetConn.getDefaultNamedGraphs() >> result
        datasetConn.getNamedGraphs() >> result
        datasetConn.getSystemDefaultNamedGraph() >> vf.createIRI("http://test.com/system-default")

        service.setTransformer(transformer)
        service.setVf(vf)
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