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

import org.matonto.persistence.utils.api.SesameTransformer
import org.matonto.dataset.api.DatasetConnection
import org.matonto.dataset.api.DatasetManager
import org.matonto.rdf.api.ModelFactory
import org.matonto.rdf.core.impl.sesame.LinkedHashModel
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory
import org.matonto.rdf.core.utils.Values
import org.matonto.repository.api.DelegatingRepository
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.base.RepositoryResult


class RDFExportSpec extends Specification {
    def service = new RDFExportServiceImpl()
    def vf = SimpleValueFactory.getInstance()

    def repoId = "test"
    def datasetId = vf.createIRI("http://test.com/dataset-record")
    def s = "http://test.com/s"
    def p = "http://test.com/p"
    def oIRI = "http://test.com/o"
    def oLit = "o"
    def testFile = new ClassPathResource("exporter/testFile.nt").getFile()
    def invalidFile = new ClassPathResource("exporter/testFile.txt").getFile()

    def transformer = Mock(SesameTransformer)
    def mf = Mock(ModelFactory)
    def datasetManager = Mock(DatasetManager)
    def repo = Mock(DelegatingRepository)
    def conn = Mock(RepositoryConnection)
    def result = Mock(RepositoryResult)
    def datasetConn = Mock(DatasetConnection)

    def setup() {
        testFile.setWritable(true)
        invalidFile.setWritable(true)

        transformer.sesameModel(_) >> { args -> Values.sesameModel(args[0])}
        mf.createModel(*_) >> new LinkedHashModel()
        repo.getRepositoryID() >> repoId
        repo.getConnection() >> conn
        conn.getStatements(*_) >> result
        datasetManager.getConnection(datasetId) >> datasetConn
        datasetManager.getConnection(!datasetId) >> {throw new IllegalArgumentException()}
        datasetConn.getStatements(*_) >> result

        service.setDatasetManager(datasetManager)
        service.setTransformer(transformer)
        service.setMf(mf)
        service.setVf(vf)
        service.addRepository(repo)
    }

    def "Export File from Repository without restrictions"() {
        when:
        def result = service.exportToFile("test", testFile.absolutePath)

        then:
        result != null
        1 * conn.getStatements(null, null, null) >> result
    }

    def "Export File from Repository with restrictions and both object IRI and Lit"() {
        when:
        def result = service.exportToFile("test", testFile.absolutePath, s, p, oIRI, oLit)

        then:
        result != null
        1 * conn.getStatements(vf.createIRI(s), vf.createIRI(p), vf.createIRI(oIRI)) >> result
    }

    def "Export File from Repository with restrictions and object Lit"() {
        when:
        def result = service.exportToFile("test", testFile.absolutePath, s, p, null, oLit)

        then:
        result != null
        1 * conn.getStatements(vf.createIRI(s), vf.createIRI(p), vf.createLiteral(oLit)) >> result
    }

    def "Throws exception if repository does not exist without restrictions"() {
        when:
        service.exportToFile("missing", testFile.getAbsolutePath())

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception if repository does not exist with restrictions"() {
        when:
        service.exportToFile("missing", testFile.getAbsolutePath(), null, null, null, null)

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception for repository if file is unwritable without restrictions"() {
        setup:
        testFile.setReadOnly()

        when:
        service.exportToFile(repoId, testFile.getAbsolutePath())

        then:
        thrown IOException
    }

    def "Throws exception for repository if file is unwritable with restrictions"() {
        setup:
        testFile.setReadOnly()

        when:
        service.exportToFile(repoId, testFile.getAbsolutePath(), null, null, null, null)

        then:
        thrown IOException
    }

    def "Throws exception for repository if file is invalid RDF Type without restrictions"() {
        when:
        service.exportToFile(repoId, invalidFile.getAbsolutePath())

        then:
        thrown IOException
    }

    def "Throws exception for repository if file is invalid RDF Type with restrictions"() {
        when:
        service.exportToFile(repoId, invalidFile.getAbsolutePath(),  null, null, null, null)

        then:
        thrown IOException
    }

    def "Export File from Dataset without restrictions"() {
        when:
        def result = service.exportToFile(datasetId, testFile.absolutePath)

        then:
        result != null
        1 * datasetConn.getStatements(null, null, null) >> result
    }

    def "Export File from Dataset with restrictions and both object IRI and Lit"() {
        when:
        def result = service.exportToFile(datasetId, testFile.absolutePath, s, p, oIRI, oLit)

        then:
        result != null
        1 * datasetConn.getStatements(vf.createIRI(s), vf.createIRI(p), vf.createIRI(oIRI)) >> result
    }

    def "Export File from Dataset with restrictions and object Lit"() {
        when:
        def result = service.exportToFile(datasetId, testFile.absolutePath, s, p, null, oLit)

        then:
        result != null
        1 * datasetConn.getStatements(vf.createIRI(s), vf.createIRI(p), vf.createLiteral(oLit)) >> result
    }

    def "Throws exception if dataset does not exist without restrictions"() {
        when:
        service.exportToFile(vf.createIRI("http://test.com/missing"), testFile.getAbsolutePath())

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception if dataset does not exist with restrictions"() {
        when:
        service.exportToFile(vf.createIRI("http://test.com/missing"), testFile.getAbsolutePath(), null, null, null, null)

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception for dataset if file is unwritable without restrictions"() {
        setup:
        testFile.setReadOnly()

        when:
        service.exportToFile(datasetId, testFile.getAbsolutePath())

        then:
        thrown IOException
    }

    def "Throws exception for dataset if file is unwritable with restrictions"() {
        setup:
        testFile.setReadOnly()

        when:
        service.exportToFile(datasetId, testFile.getAbsolutePath(), null, null, null, null)

        then:
        thrown IOException
    }

    def "Throws exception for dataset if file is invalid RDF Type without restrictions"() {
        when:
        service.exportToFile(datasetId, invalidFile.getAbsolutePath())

        then:
        thrown IOException
    }

    def "Throws exception for dataset if file is invalid RDF Type with restrictions"() {
        when:
        service.exportToFile(datasetId, invalidFile.getAbsolutePath(),  null, null, null, null)

        then:
        thrown IOException
    }
}