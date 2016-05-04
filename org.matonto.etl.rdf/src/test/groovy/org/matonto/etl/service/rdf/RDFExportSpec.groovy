package org.matonto.etl.service.rdf

import org.matonto.rdf.api.ModelFactory
import org.matonto.rdf.core.impl.sesame.LinkedHashModel
import org.matonto.repository.api.DelegatingRepository
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.base.RepositoryResult


class RDFExportSpec extends Specification {

    def "Nonexistant repository causes exception" (){
        setup:
        RDFExportServiceImpl ex = new RDFExportServiceImpl()

        when:
        ex.exportToFile("cli-rdf-service", "exporter/testFile.nq")

        then:
        thrown IllegalArgumentException
    }

    def "Unwritable file causes exception" (){
        setup:
        RDFExportServiceImpl exportService = new RDFExportServiceImpl()
        File textFile = new ClassPathResource("exporter/testFile.txt").getFile()
        textFile.setReadOnly()

        when:
        exportService.exportToFile("test", "exporter/testFile.txt")

        then:
        thrown IOException
    }

    def "Invalid RDF Type causes exception" (){
        setup:
        RDFExportServiceImpl exportService = new RDFExportServiceImpl()
        File textFile = new ClassPathResource("exporter/testFile.txt").getFile()
        textFile.setWritable(true)

        when:
        exportService.exportToFile("test", "exporter/testFile.txt")

        then:
        thrown IOException
    }

    def "Export File from Repository" (){
        setup:
        RDFExportServiceImpl exportService = new RDFExportServiceImpl()
        File testFile = new ClassPathResource("exporter/testFile.nt").getFile()
        def repo = Mock(DelegatingRepository.class)
        RepositoryConnection connection = Mock()
        RepositoryResult result = Mock()
        ModelFactory mf = Mock()
        exportService.setModelFactory(mf)

        when:
        exportService.addRepository(repo)
        exportService.exportToFile("test", testFile.absolutePath)

        then:
        1 * repo.getRepositoryID() >> "test"
        1 * repo.getConnection() >> connection
        1 * connection.getStatements(null, null, null) >> result
        1 * mf.createModel() >> new LinkedHashModel()
    }

}