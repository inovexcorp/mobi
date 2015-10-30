package org.matonto.etl.service.rdf

import org.openrdf.model.Model
import org.openrdf.model.impl.LinkedHashModel
import org.openrdf.repository.Repository
import org.openrdf.repository.RepositoryConnection
import org.openrdf.repository.RepositoryResult
import org.openrdf.repository.RepositoryException
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import org.springframework.core.io.ClassPathResource
import spock.lang.Specification
import java.io.FileReader
import info.aduna.iteration.Iterations
import org.openrdf.repository.sail.SailRepository
import org.openrdf.sail.memory.MemoryStore
import java.io.IOException


class RDFImportSpec extends Specification {

    //def repository = Mock(Repository)

    def bnode = "_:matonto/bnode/"


    def "Import trig file into openrdf repository in karaf"() {
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        importService.setRepository(repo)
        File trigFile = new ClassPathResource("importer/testFile.trig").getFile();
        String repositoryId = "cli-rdf-service";
        Boolean cont = true;
        Model m = new LinkedHashModel();
        Model m2 = new LinkedHashModel();
        FileReader r = new FileReader(trigFile);

        RepositoryConnection repoConnection = repo.getConnection()
        m = Rio.parse(r, "", RDFFormat.TRIG)
        importService.importFile(repositoryId, trigFile, cont)
        RepositoryResult result = repoConnection.getStatements(null, null, null, true)
        System.out.println("RESULT: " + result)
        m2.addAll(result.asList())

        expect:
        m.equals(m2)
    }

    def "Import ntriples file into openrdf repository in karaf"() {
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        importService.setRepository(repo)
        File ntFile = new ClassPathResource("importer/testFile.nt").getFile();
        String repositoryId = "cli-rdf-service";
        Boolean cont = true;
        Model m = new LinkedHashModel();
        Model m2 = new LinkedHashModel();
        FileReader r = new FileReader(ntFile);

        RepositoryConnection repoConnection = repo.getConnection()
        m = Rio.parse(r, "", RDFFormat.NTRIPLES)
        importService.importFile(repositoryId, ntFile, cont)
        RepositoryResult result = repoConnection.getStatements(null, null, null, true)
        System.out.println("RESULT: " + result)
        m2.addAll(result.asList())

        expect:
        m.equals(m2)
    }

    def "Import rdf file into openrdf repository in karaf"() {
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        importService.setRepository(repo)
        File rdfFile = new ClassPathResource("importer/testFile.rdf").getFile();
        String repositoryId = "cli-rdf-service";
        Boolean cont = true;
        Model m = new LinkedHashModel();
        Model m2 = new LinkedHashModel();
        FileReader r = new FileReader(rdfFile);

        RepositoryConnection repoConnection = repo.getConnection()
        m = Rio.parse(r, "", RDFFormat.RDFXML)
        importService.importFile(repositoryId, rdfFile, cont)
        RepositoryResult result = repoConnection.getStatements(null, null, null, true)
        System.out.println("RESULT: " + result)
        m2.addAll(result.asList())

        expect:
        m.equals(m2)
    }

    def "Import nquads file into openrdf repository in karaf"() {
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        importService.setRepository(repo)
        File nqFile = new ClassPathResource("importer/testFile.nq").getFile();
        String repositoryId = "cli-rdf-service";
        Boolean cont = true;
        Model m = new LinkedHashModel();
        Model m2 = new LinkedHashModel();
        FileReader r = new FileReader(nqFile);

        RepositoryConnection repoConnection = repo.getConnection()
        m = Rio.parse(r, "", RDFFormat.NQUADS)
        importService.importFile(repositoryId, nqFile, cont)
        RepositoryResult result = repoConnection.getStatements(null, null, null, true)
        System.out.println("RESULT: " + result)
        m2.addAll(result.asList())

        expect:
        m.equals(m2)
    }

    def "Import turtle file into openrdf repository in karaf"() {
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        importService.setRepository(repo)
        File turtleFile = new ClassPathResource("importer/testFile.ttl").getFile();
        String repositoryId = "cli-rdf-service";
        Boolean cont = true;
        Model m = new LinkedHashModel();
        Model m2 = new LinkedHashModel();
        FileReader r = new FileReader(turtleFile);

        RepositoryConnection repoConnection = repo.getConnection()
        m = Rio.parse(r, "", RDFFormat.TURTLE)
        importService.importFile(repositoryId, turtleFile, cont)
        RepositoryResult result = repoConnection.getStatements(null, null, null, true)
        System.out.println("RESULT: " + result)
        m2.addAll(result.asList())

        expect:
        m.equals(m2)
    }

    def "Nonexistant repository causes exception"() {
        setup:
        RDFImportServiceImpl imp = new RDFImportServiceImpl()
        File textFile = new ClassPathResource("importer/testFile.ttl").getFile()

        when:
        imp.importFile("cli-rdf-service", textFile, true)

        then:
        thrown RepositoryException
    }

    def "Invalid RDF type causes exception"() {
        setup:
        RDFImportServiceImpl importService = new RDFImportServiceImpl()
        File textFile = new ClassPathResource("importer/testFile.txt").getFile()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        importService.setRepository(repo)

        when:
        importService.importFile("cli-rdf-service", textFile, true)

        then:
        thrown IOException
    }
    
}