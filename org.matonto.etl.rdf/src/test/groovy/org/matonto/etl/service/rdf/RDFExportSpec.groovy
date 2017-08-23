/*-
 * #%L
 * org.matonto.etl.rdf
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
package org.matonto.etl.service.rdf

import org.matonto.dataset.api.DatasetConnection
import org.matonto.dataset.api.DatasetManager
import org.matonto.etl.api.config.RDFExportConfig
import org.matonto.persistence.utils.api.SesameTransformer
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.matonto.repository.api.DelegatingRepository
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.base.RepositoryResult
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

        service.setDatasetManager(datasetManager)
        service.setTransformer(transformer)
        service.setVf(vf)
        service.addRepository(repo)
    }

    def "Export File from Repository without restrictions"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).build()

        when:
        def result = service.exportToFile(config, repoId)

        then:
        result != null
        1 * conn.getStatements(null, null, null) >> result
    }

    def "Export File from Repository with restrictions and only subj"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).subj(s).build()

        when:
        def result = service.exportToFile(config, repoId)

        then:
        result != null
        1 * conn.getStatements(vf.createIRI(s), null, null) >> result
    }

    def "Export File from Repository with restrictions and only pred"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).pred(p).build()

        when:
        def result = service.exportToFile(config, repoId)

        then:
        result != null
        1 * conn.getStatements(null, vf.createIRI(p), null) >> result
    }

    def "Export File from Repository with restrictions and both object IRI and Lit"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).objIRI(oIRI).objLit(oLit).build()

        when:
        def result = service.exportToFile(config, repoId)

        then:
        result != null
        1 * conn.getStatements(null, null, vf.createIRI(oIRI)) >> result
    }

    def "Export File from Repository with restrictions and only object Lit"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).objLit(oLit).build()

        when:
        def result = service.exportToFile(config, repoId)

        then:
        result != null
        1 * conn.getStatements(null, null, vf.createLiteral(oLit)) >> result
    }

    def "Throws exception if repository does not exist"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).build()

        when:
        service.exportToFile(config, "missing")

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception for repository if file is unwritable"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).build()
        testFile.setReadOnly()

        when:
        service.exportToFile(config, repoId)

        then:
        thrown IOException
    }

    def "Throws exception for repository if file is invalid RDF Type"() {
        setup:
        def config = new RDFExportConfig.Builder(invalidFile.absolutePath).build()

        when:
        service.exportToFile(config, repoId)

        then:
        thrown IOException
    }

    def "Export File from Dataset without restrictions with quads"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).build()

        when:
        def result = service.exportToFile(config, datasetId)

        then:
        result != null
        2 * datasetConn.getStatements(null, null, null, _) >> result
    }

    def "Export File from Dataset without restrictions without quads"() {
        setup:
        def config = new RDFExportConfig.Builder(testFileWithoutQuads.absolutePath).build()

        when:
        def result = service.exportToFile(config, datasetId)

        then:
        result != null
        1 * datasetConn.getStatements(null, null, null, _) >> result
    }

    def "Export File from Dataset with restrictions and both object IRI and Lit with quads"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).subj(s).pred(p).objIRI(oIRI).objLit(oLit).build()

        when:
        def result = service.exportToFile(config, datasetId)

        then:
        result != null
        2 * datasetConn.getStatements(vf.createIRI(s), vf.createIRI(p), vf.createIRI(oIRI), _) >> result
    }

    def "Export File from Dataset with restrictions and both object IRI and Lit without quads"() {
        setup:
        def config = new RDFExportConfig.Builder(testFileWithoutQuads.absolutePath).subj(s).pred(p).objIRI(oIRI).objLit(oLit).build()

        when:
        def result = service.exportToFile(config, datasetId)

        then:
        result != null
        1 * datasetConn.getStatements(vf.createIRI(s), vf.createIRI(p), vf.createIRI(oIRI), _) >> result
    }

    def "Export File from Dataset with restrictions and object Lit with quads"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).subj(s).pred(p).objLit(oLit).build()

        when:
        def result = service.exportToFile(config, datasetId)

        then:
        result != null
        2 * datasetConn.getStatements(vf.createIRI(s), vf.createIRI(p), vf.createLiteral(oLit), _) >> result
    }

    def "Export File from Dataset with restrictions and object Lit without quads"() {
        setup:
        def config = new RDFExportConfig.Builder(testFileWithoutQuads.absolutePath).subj(s).pred(p).objLit(oLit).build()

        when:
        def result = service.exportToFile(config, datasetId)

        then:
        result != null
        1 * datasetConn.getStatements(vf.createIRI(s), vf.createIRI(p), vf.createLiteral(oLit), _) >> result
    }

    def "Throws exception if dataset does not exist"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).build()

        when:
        service.exportToFile(config, vf.createIRI("http://test.com/missing"))

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception for dataset if file is unwritable"() {
        setup:
        def config = new RDFExportConfig.Builder(testFile.absolutePath).build()
        testFile.setReadOnly()

        when:
        service.exportToFile(config, datasetId)

        then:
        thrown IOException
    }

    def "Throws exception for dataset if file is invalid RDF Type"() {
        setup:
        def config = new RDFExportConfig.Builder(invalidFile.absolutePath).build()

        when:
        service.exportToFile(config, datasetId)

        then:
        thrown IOException
    }
}