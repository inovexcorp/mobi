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
package com.mobi.etl.service.rdf

import com.mobi.dataset.api.DatasetConnection
import com.mobi.dataset.api.DatasetManager
import com.mobi.etl.api.config.rdf.ImportServiceConfig
import com.mobi.repository.api.OsgiRepository
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory
import org.eclipse.rdf4j.repository.RepositoryConnection
import org.eclipse.rdf4j.rio.RDFFormat
import org.eclipse.rdf4j.rio.RDFParseException
import org.eclipse.rdf4j.rio.Rio
import spock.lang.Specification

class RDFImportSpec extends Specification {
    def service = new RDFImportServiceImpl()
    def vf = new ValidatingValueFactory()

    def repoId = "test"
    def datasetId = vf.createIRI("http://test.com/dataset-record")
    def file = new File(this.getClass().getResource("/importer/testFile.trig").toURI())
    def model = Rio.parse(new FileInputStream(file), "", RDFFormat.TRIG)

    def datasetManager = Mock(DatasetManager)
    def repo = Mock(OsgiRepository)
    def conn = Mock(RepositoryConnection)
    def datasetConn = Mock(DatasetConnection)

    def setup() {
        repo.getRepositoryID() >> repoId
        repo.getConnection() >> conn
        datasetManager.getConnection(datasetId) >> datasetConn
        datasetManager.getConnection(!datasetId) >> {throw new IllegalArgumentException()}

        service.datasetManager = datasetManager
        service.addRepository(repo)
    }

    def "Imports trig file to repository without format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).build()

        when:
        service.importFile(config, file)

        then:
        (1.._) * conn.add(*_)
    }

    def "Imports trig file to repository with format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).format(RDFFormat.TRIG).build()

        when:
        service.importFile(config, file)

        then:
        (1.._) * conn.add(*_)
    }

    def "Imports Model to repository"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).build()

        when:
        service.importModel(config, model)

        then:
        (1.._) * conn.add(*_)
    }

    def "Imports InputStream to repository with format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).format(RDFFormat.TRIG).build()

        when:
        service.importInputStream(config, new FileInputStream(file), false)

        then:
        (1.._) * conn.add(*_)
    }

    def "Throws exception if no format when importing InputStream"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).build()

        when:
        service.importInputStream(config, new FileInputStream(file), false)

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception if repository ID does not exist"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository("missing").build()

        when:
        service.importFile(config, file)

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception for repository if invalid file type"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).build()
        File f = new File(this.getClass().getResource("/importer/testFile.txt").toURI())

        when:
        service.importFile(config, f)

        then:
        thrown IOException
    }

    def "Throws exception for repository if invalid language tag"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(false).repository(repoId).build()
        File f = new File(this.getClass().getResource("/importer/invalidlanguage.owl").toURI());
        when:
        service.importFile(config, f)

        then:
        thrown RDFParseException
    }

    def "Throws exception for repository if nonexistent file"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).build()
        File f = new File("importer/FakeFile.trig")

        when:
        service.importFile(config, f)

        then:
        thrown IOException
    }

    def "Imports trig file to dataset without format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(datasetId).build()

        when:
        service.importFile(config, file)

        then:
        (1.._) * datasetConn.add(*_)
    }

    def "Imports trig file to dataset with format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(datasetId).format(RDFFormat.TRIG).build()

        when:
        service.importFile(config, file)

        then:
        (1.._) * datasetConn.add(*_)
    }

    def "Imports Model to dataset"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(datasetId).build()

        when:
        service.importModel(config, model)

        then:
        (1.._) * datasetConn.add(*_)
    }

    def "Imports InputStream to dataset with format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(datasetId).format(RDFFormat.TRIG).build()

        when:
        service.importInputStream(config, new FileInputStream(file), false)

        then:
        (1.._) * datasetConn.add(*_)
    }

    def "Throws exception if dataset record ID does not exist"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(vf.createIRI("http://test.com/missing")).build()

        when:
        service.importFile(config, file)

        then:
        thrown IllegalArgumentException
    }

    def "Throws exception for dataset if invalid file type"(){
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(datasetId).build()
        File f = new File(this.getClass().getResource("/importer/testFile.txt").toURI())

        when:
        service.importFile(config, f)

        then:
        thrown IOException
    }

    def "Throws exception for dataset if nonexistent file"(){
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).dataset(datasetId).build()
        File f = new File("importer/FakeFile.trig")

        when:
        service.importFile(config, f)

        then:
        thrown IOException
    }

    def "Imports trig file to graph in repository without format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).build()
        def graph = vf.createIRI("urn:graph");

        when:
        service.importFile(config, file, graph)

        then:
        (1.._) * conn.add(*_)
    }

    def "Imports trig file to graph in repository with format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(true).repository(repoId).format(RDFFormat.TRIG).build()
        def graph = vf.createIRI("urn:graph");

        when:
        service.importFile(config, file, graph)

        then:
        (1.._) * conn.add(*_)
    }

    def "Imports rdf* ttl file to graph in repository without format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(false).repository(repoId).build()
        def graph = vf.createIRI("urn:graph");
        def starFile = new File(this.getClass().getResource("/importer/star.ttl").toURI())

        when:
        service.importFile(config, starFile, graph)

        then:
        thrown(RDFParseException.class)
    }

    def "Imports rdf* ttls file to graph in repository without format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(false).repository(repoId).build()
        def graph = vf.createIRI("urn:graph");
        def starFile = new File(this.getClass().getResource("/importer/star.ttls").toURI())

        when:
        service.importFile(config, starFile, graph)

        then:
        thrown(IllegalStateException.class)
    }

    def "Imports rdf* trig file to graph in repository without format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(false).repository(repoId).build()
        def graph = vf.createIRI("urn:graph");
        def starFile = new File(this.getClass().getResource("/importer/star.trig").toURI())

        when:
        service.importFile(config, starFile, graph)

        then:
        thrown(RDFParseException.class)
    }

    def "Imports rdf* trigs file to graph in repository without format"() {
        setup:
        def config = new ImportServiceConfig.Builder().continueOnError(false).repository(repoId).build()
        def graph = vf.createIRI("urn:graph");
        def starFile = new File(this.getClass().getResource("/importer/star.trigs").toURI())

        when:
        service.importFile(config, starFile, graph)

        then:
        thrown(IllegalStateException.class)
    }
}
