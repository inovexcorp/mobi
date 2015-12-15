package org.matonto.etl.service.rdf

import org.matonto.repository.api.RepositoryManager
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification
import org.matonto.repository.api.Repository
import org.matonto.repository.api.RepositoryConnection
import org.matonto.repository.base.RepositoryResult


class RDFExportSpec extends Specification {


    def "Nonexistant repository causes exception" (){
        setup:
        RepositoryManager rm = Mock()
        RDFExportServiceImpl ex = new RDFExportServiceImpl()
        ex.setRepositoryManager(rm);
        File textFile = new ClassPathResource("exporter/testFile.nq").getFile()

        when:
        ex.exportToFile("cli-rdf-service", textFile)

        then:
        1 * rm.getRepository("cli-rdf-service") >> Optional.empty();
        thrown IllegalArgumentException
    }

    def "Unwritable file causes exception" (){
        setup:
        RDFExportServiceImpl exportService = new RDFExportServiceImpl()
        File textFile = new ClassPathResource("exporter/testFile.txt").getFile()
        textFile.setReadOnly()

        when:
        exportService.exportToFile("test", textFile)

        then:
        thrown IOException
    }

    def "Invalid RDF Type causes exception" (){
        setup:
        RDFExportServiceImpl exportService = new RDFExportServiceImpl()
        File textFile = new ClassPathResource("exporter/testFile.txt").getFile()
        textFile.setWritable(true)

        when:
        exportService.exportToFile("test", textFile)

        then:
        thrown IOException
    }

    def "Export File from Repository" (){
        setup:
        RDFExportServiceImpl exportService = new RDFExportServiceImpl()
        File testFile = new ClassPathResource("exporter/testFile.nt").getFile()
        RepositoryManager manager = Mock()
        Repository repo = Mock()
        RepositoryConnection connection = Mock()
        RepositoryResult result = Mock()

        when:
        exportService.setRepositoryManager(manager)
        exportService.exportToFile("test", testFile)

        then:
        1 * manager.getRepository("test") >> Optional.of(repo)
        1 * repo.getConnection() >> connection
        1 * connection.getStatements(null, null, null) >> result
    }

}