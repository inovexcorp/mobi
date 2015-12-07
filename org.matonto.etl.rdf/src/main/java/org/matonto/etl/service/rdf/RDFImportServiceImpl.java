package org.matonto.etl.service.rdf;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import org.matonto.etl.api.rdf.RDFImportService;
import org.openrdf.model.Model;
import org.openrdf.model.URI;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.model.impl.URIImpl;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.repository.manager.RepositoryManager;
import org.openrdf.rio.*;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.openrdf.rio.helpers.StatementCollector;

@Component(provide = RDFImportService.class, immediate = true)
public class RDFImportServiceImpl implements RDFImportService {

    private RepositoryManager repositoryManager;

    private Repository repository;

    private RepositoryConnection repConnect;


    @Reference
    public void setRepositoryManager(RepositoryManager repositoryManager){this.repositoryManager = repositoryManager;}

    @Reference(target = "(repositorytype=memory)")
    public void setRepository(Repository repository) {
        this.repository = repository;
    }

    /**
     * Imports a file into the openrdf repository (with the given repositoryID) deployed on karaf
     * @throws FileNotFoundException
     */
    public void importFile(String repositoryID,  File file, Boolean cont) throws FileNotFoundException, IOException, RepositoryException, RDFParseException {


        if (file == null) {
            throw new FileNotFoundException("File does not exist or could not be found");
        }
        if(repository == null){
            throw new RepositoryException("Repository does not exist/could not be found.");
        }

        //Get the rdf format based on the file name. If the format returns null, it is an unsupported file type.
        RDFFormat format = Rio.getParserFormatForFileName(file.getName());

        if (format == null) {
            throw new IOException("Invalid format type! Please use the help command to check valid formats.");
        }

        URI newURI = new URIImpl("<http://matonto.org/>");

        RDFParser parser = Rio.createParser(format);
        Model m = new LinkedHashModel();
        parser.setRDFHandler(new StatementCollector(m));
        try {
            parser.parse(new FileReader(file), "");
        }catch(RDFHandlerException e){
            throw new RDFParseException(e);
        }

        try {
            RepositoryConnection repositoryConnection = repositoryManager.getRepository(repositoryID).getConnection();
            repositoryConnection.add(m);
        }catch(RepositoryConfigException e){
            throw new RepositoryException(e);
        }


//        repConnect = repository.getConnection();
//        if(repConnect == null){
//            throw new RepositoryException("Failed to connect to the repository.");
//        }
//        System.out.println("Repository connected!");
//        // ASK ABOUT THE ADD METHOD
//        repConnect.add(file, newURI.toString(), format);
//
//
//
//        repConnect.close();
    }

    /**
     * Imports a file with a specified format into the openrdf repository (with the given repositoryID) deployed on karaf
     */
    public void importFile(String repositoryID, File file, Boolean cont, RDFFormat format) throws FileNotFoundException, IOException, RepositoryException, RDFParseException {


        if (file == null) {
            throw new FileNotFoundException();
        }
        if(repository == null){
            throw new RepositoryException("Repository does not exist/could not be found.");
        }

        //If the format passd in is null, try and get the format from the filename. Otherwise, throw an exception
        if (format == null) {
            format = Rio.getParserFormatForFileName(file.getName());

            if (format == null) {
                throw new IOException();
            }
        }

        RDFParser parser = Rio.createParser(format);
        Model m = new LinkedHashModel();
        parser.setRDFHandler(new StatementCollector(m));
        try {
            parser.parse(new FileReader(file), "");
        }catch(RDFHandlerException e){
            throw new RDFParseException(e);
        }

        try {
            RepositoryConnection repositoryConnection = repositoryManager.getRepository(repositoryID).getConnection();
            repositoryConnection.add(m);
        }catch(RepositoryConfigException e){
            throw new RepositoryException(e);
        }


//        repConnect = repository.getConnection();
//        if(repConnect == null){
//            throw new RepositoryException("Failed to connect to the repository.");
//        }
//        System.out.println("Repository connected!");
//        // ASK ABOUT THE ADD METHOD
//        repConnect.add(file, newURI.toString(), format);
//
//
//
//        repConnect.close();

    }

}