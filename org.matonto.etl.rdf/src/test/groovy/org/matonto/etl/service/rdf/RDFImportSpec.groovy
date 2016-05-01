package org.matonto.etl.service.rdf

import org.matonto.rdf.api.Model
import org.matonto.rdf.api.ModelFactory
import org.matonto.rdf.api.Statement
import org.matonto.rdf.core.impl.sesame.LinkedHashModel
import org.matonto.repository.api.DelegatingRepository
import org.matonto.repository.api.RepositoryConnection
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification


class RDFImportSpec extends Specification {

    def "Throws exception if repository ID does not exist"(){
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        File testFile = new ClassPathResource("importer/testFile.trig").getFile();
        def mf = Mock(ModelFactory.class)
        importService.setModelFactory(mf)

        when:
        importService.importFile("test", testFile, true)

        then:
        1 * mf.createModel(_ as Collection<Statement>) >> new LinkedHashModel()
        thrown IllegalArgumentException
    }

    def "Test trig file"(){
        setup:
        def repo = Mock(DelegatingRepository.class)
        RepositoryConnection repoConn = Mock()
        ModelFactory factory = Mock()
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        File testFile = new ClassPathResource("importer/testFile.trig").getFile();

        when:
        importService.addRepository(repo)
        importService.setModelFactory(factory)
        importService.importFile("test", testFile, true)

        then:
        1 * repo.getRepositoryID() >> "test"
        1 * repo.getConnection() >> repoConn
        1 * factory.createModel(_) >> Mock(Model.class)
    }

    def "Invalid file type causes error"(){
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        File f = new ClassPathResource("importer/testFile.txt").getFile();

        when:
        importService.importFile("test",f, true);

        then:
        thrown IOException
    }

    def "Nonexistent file throws exception"(){
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        File f = new File("importer/FakeFile.txt");

        when:
        importService.importFile("test",f,true);

        then:
        thrown IOException
    }
}