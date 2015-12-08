package org.matonto.etl.service.rdf

import org.openrdf.model.Model
import org.openrdf.model.URI;
import org.openrdf.model.impl.LinkedHashModel
import org.openrdf.model.impl.URIImpl;
import org.openrdf.repository.Repository
import org.openrdf.repository.RepositoryConnection
import org.openrdf.repository.RepositoryException
import org.openrdf.rio.RDFFormat
import org.openrdf.rio.Rio
import org.openrdf.rio.UnsupportedRDFormatException
import org.springframework.core.io.ClassPathResource

import spock.lang.Specification


import org.openrdf.repository.sail.SailRepository
import org.openrdf.sail.memory.MemoryStore

import java.io.IOException
import java.io.FileNotFoundException

class RDFExportSpec extends Specification {


    def "Export trig data from openrdf repository into trig file"(){
        setup:
        RDFExportServiceImpl ex = new RDFExportServiceImpl()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        ex.setRepository(repo)
        File trigFile = new ClassPathResource("exporter/testFile.trig").getFile();
        File trigExp = new ClassPathResource("exporter/trigExport.trig").getFile();

        RepositoryConnection repoConnection = repo.getConnection()
        URI newURI = new URIImpl("<http://matonto.org/>");
        repoConnection.add(trigFile, newURI.toString(), RDFFormat.TRIG);
        System.out.println("EMPTY " + repoConnection.isEmpty());
        String repositoryId = "cli-rdf-service";
        Boolean cont = true;
        FileReader r = new FileReader(trigFile);
        FileReader r2 = new FileReader(trigExp)

        Model m = new LinkedHashModel();
        Model m2 = new LinkedHashModel();
        m = Rio.parse(r, "", RDFFormat.TRIG)

        ex.exportToFile(repositoryId, trigExp)

        m2 = Rio.parse(r2, "", RDFFormat.TRIG)

        expect:
        m.equals(m2)

    }

    def "Export rdf data from openrdf repository into rdf file"(){
        setup:
        RDFExportServiceImpl ex = new RDFExportServiceImpl()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        ex.setRepository(repo)
        File rdfFile = new ClassPathResource("exporter/testFile.rdf").getFile();
        File rdfExp = new ClassPathResource("exporter/rdfExport.rdf").getFile();

        RepositoryConnection repoConnection = repo.getConnection()
        URI newURI = new URIImpl("<http://matonto.org/>");
        repoConnection.add(rdfFile, newURI.toString(), RDFFormat.RDFXML);
        String repositoryId = "cli-rdf-service";
        Boolean cont = true;
        FileReader r = new FileReader(rdfFile);
        FileReader r2 = new FileReader(rdfExp);

        Model m = new LinkedHashModel();
        Model m2 = new LinkedHashModel();
        m = Rio.parse(r, "", RDFFormat.RDFXML)

        ex.exportToFile(repositoryId, rdfExp)

        m2 = Rio.parse(r2, "", RDFFormat.RDFXML)

        expect:
        m.equals(m2)

    }

    def "Export nquads data from openrdf repository into rdf file"(){
        setup:
        RDFExportServiceImpl ex = new RDFExportServiceImpl()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        ex.setRepository(repo)
        File nqFile = new ClassPathResource("exporter/testFile.nq").getFile();
        File nqExp = new ClassPathResource("exporter/nquadsExport.nq").getFile();

        RepositoryConnection repoConnection = repo.getConnection()
        URI newURI = new URIImpl("<http://matonto.org/>");
        repoConnection.add(nqFile, newURI.toString(), RDFFormat.NQUADS);
        String repositoryId = "cli-rdf-service";
        Boolean cont = true;
        FileReader r = new FileReader(nqFile);
        FileReader r2 = new FileReader(nqExp);

        Model m = new LinkedHashModel();
        Model m2 = new LinkedHashModel();
        m = Rio.parse(r, "", RDFFormat.NQUADS)

        ex.exportToFile(repositoryId, nqExp)

        m2 = Rio.parse(r2, "", RDFFormat.NQUADS)

        expect:
        m.equals(m2)

    }

    def "Export turtle data from openrdf repository into ttl file"(){
        setup:
        RDFExportServiceImpl ex = new RDFExportServiceImpl()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        ex.setRepository(repo)
        File ntFile = new ClassPathResource("exporter/testFile.ttl").getFile();
        File ntExp = new ClassPathResource("exporter/ttlExport.ttl").getFile();

        RepositoryConnection repoConnection = repo.getConnection()
        URI newURI = new URIImpl("<http://matonto.org/>");
        repoConnection.add(ntFile, newURI.toString(), RDFFormat.TURTLE);
        String repositoryId = "cli-rdf-service";
        Boolean cont = true;
        FileReader r = new FileReader(ntFile);
        FileReader r2 = new FileReader(ntExp);

        Model m = new LinkedHashModel();
        Model m2 = new LinkedHashModel();
        m = Rio.parse(r, "", RDFFormat.TURTLE)

        ex.exportToFile(repositoryId, ntExp)

        m2 = Rio.parse(r2, "", RDFFormat.TURTLE)

        expect:
        m.equals(m2)

    }

    def "Export ntriple data from openrdf repository into nt file"(){
        setup:
        RDFExportServiceImpl ex = new RDFExportServiceImpl()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        ex.setRepository(repo)
        File ntFile = new ClassPathResource("exporter/testFile.nt").getFile();
        File ntExp = new ClassPathResource("exporter/ntExport.nt").getFile();

        RepositoryConnection repoConnection = repo.getConnection()
        URI newURI = new URIImpl("<http://matonto.org/>");
        repoConnection.add(ntFile, newURI.toString(), RDFFormat.NTRIPLES);
        String repositoryId = "cli-rdf-service";
        Boolean cont = true;
        FileReader r = new FileReader(ntFile);
        FileReader r2 = new FileReader(ntExp);

        Model m = new LinkedHashModel();
        Model m2 = new LinkedHashModel();
        m = Rio.parse(r, "", RDFFormat.NTRIPLES)

        ex.exportToFile(repositoryId, ntExp)

        m2 = Rio.parse(r2, "", RDFFormat.NTRIPLES)

        expect:
        m.equals(m2)

    }

    def "Invalid RDF type causes exception"(){
        setup:
        RDFExportServiceImpl ex = new RDFExportServiceImpl()
        File textFile = new ClassPathResource("exporter/testFile.txt").getFile()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        ex.setRepository(repo)

        when:
        ex.exportToFile("cli-rdf-service", textFile)

        then:
        thrown UnsupportedRDFormatException
    }

    def "Nonexistant repository causes exception" (){
        setup:
        RDFExportServiceImpl ex = new RDFExportServiceImpl()
        File textFile = new ClassPathResource("exporter/testFile.txt").getFile()

        when:
        ex.exportToFile("cli-rdf-service", textFile)

        then:
        thrown RepositoryException
    }

    def "Unwritable file causes exception"(){
        setup:
        RDFExportServiceImpl ex = new RDFExportServiceImpl()
        File textFile = new ClassPathResource("exporter/testFile.txt").getFile()
        textFile.setReadOnly()
        Repository repo = new SailRepository(new MemoryStore())
        repo.initialize()
        ex.setRepository(repo)

        when:
        ex.exportToFile("cli-rdf-service", textFile)

        then:
        thrown Exception
    }

}