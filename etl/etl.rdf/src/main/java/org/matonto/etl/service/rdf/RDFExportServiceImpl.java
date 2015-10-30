package org.matonto.etl.service.rdf;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import org.matonto.etl.api.rdf.RDFExportService;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.impl.ValueFactoryImpl;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.n3.N3Writer;
import org.openrdf.rio.nquads.NQuadsWriter;
import org.openrdf.rio.rdfjson.RDFJSONWriter;
import org.openrdf.rio.rdfxml.RDFXMLWriter;
import org.openrdf.rio.trig.TriGWriter;
import org.openrdf.rio.turtle.TurtleWriter;
import org.apache.commons.io.FilenameUtils;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;


@Component(provide = RDFExportService.class, immediate=true)
public class RDFExportServiceImpl implements RDFExportService {

    private Repository repository;

    private RepositoryConnection repConnect;

    private RDFHandler handler;


    @Reference(target="(repositorytype=memory)")
    public void setRepository(Repository repository) {
        this.repository = repository;
    }


    /**
     * Exports all info from the repository with the given repositoryID into the file specified.
     * @throws IOException
     */
    public void exportToFile(String repositoryID, File file) throws RepositoryException, RDFHandlerException, IOException, Exception {

        if(repository == null){
            throw new RepositoryException("Repository does not exist/could not be found.");
        }

        repConnect = repository.getConnection();
        if(repConnect == null){
            throw new RepositoryException("Repository does not exist/could not be found.");
        }
        System.out.println("Repository connected!");

        String ext = FilenameUtils.getExtension(file.getName());

        if(ext.equalsIgnoreCase("ttl")){
            handler = new TurtleWriter(new BufferedWriter(new FileWriter(file.getAbsoluteFile())));
        }
        else if(ext.equalsIgnoreCase("trig")){
            handler = new TriGWriter(new BufferedWriter(new FileWriter(file.getAbsoluteFile())));
        }
        else if(ext.equalsIgnoreCase("xml") || ext.equalsIgnoreCase("rdf")){
            handler = new RDFXMLWriter(new BufferedWriter(new FileWriter(file.getAbsoluteFile())));
        }
        else if(ext.equalsIgnoreCase("nt")){
            handler = new N3Writer(new BufferedWriter(new FileWriter(file.getAbsoluteFile())));
        }
        else if(ext.equalsIgnoreCase("nq")){
            handler = new NQuadsWriter(new BufferedWriter(new FileWriter(file.getAbsoluteFile())));
        }
        else if(ext.equalsIgnoreCase("jsonld")){
            handler = new RDFJSONWriter(new BufferedWriter(new FileWriter(file.getAbsoluteFile())), RDFFormat.JSONLD);
        }
        else{
            System.out.println(ext);
            throw new IOException("IOException! File type not supported by Sesame.");
        }

        if(file.canWrite() == false){
            //Create file cannot be written exception.
            throw new Exception("File cannot be written to!");
        }

        repConnect.export(handler);

        System.out.println("Exporting complete!");

    }

    /**
     * Exports the rdf statements with the given subject, predicate, and object into the given file with a given filetype.
     * Enter null in the subj, pred, and obj fields if you don't want to filter by a particular value
     */
    public void exportToFile(String repositoryID, File file, String filetype, String subj, String pred, String obj) throws RepositoryException, RDFHandlerException, IOException, Exception {

        ValueFactory vf = ValueFactoryImpl.getInstance();


        repConnect = repository.getConnection();

        if(repConnect == null){
            throw new RepositoryException("Repository does not exist/could not be found.");
        }
        System.out.println("Repository connected!");

        if(filetype.equalsIgnoreCase("turtle") || filetype.equalsIgnoreCase("ttl")){
            handler = new TurtleWriter(new BufferedWriter(new FileWriter(file.getAbsoluteFile())));
        }
        else if(filetype.equalsIgnoreCase("trig")){
            handler = new TriGWriter(new BufferedWriter(new FileWriter(file.getAbsoluteFile())));
        }
        else if(filetype.equalsIgnoreCase("xml")){
            handler = new RDFXMLWriter(new BufferedWriter(new FileWriter(file.getAbsoluteFile())));
        }
        else if(filetype.equalsIgnoreCase("ntriples")){
            handler = new N3Writer(new BufferedWriter(new FileWriter(file.getAbsoluteFile())));
        }
        else if(filetype.equalsIgnoreCase("nquads")){
            handler = new NQuadsWriter(new BufferedWriter(new FileWriter(file.getAbsoluteFile())));
        }
        else if(filetype.equalsIgnoreCase("jsonld")){
            handler = new RDFJSONWriter(new BufferedWriter(new FileWriter(file.getAbsoluteFile())), RDFFormat.JSONLD);
        }
        else{
            //Create file type exception
            throw new IOException("IOException! File type not supported by Sesame.");
        }

        if(file.canWrite() == false){
            //Create file cannot be written exception.
            throw new Exception("File cannot be written to!");
        }


        if(subj == null){
            if(pred == null){
                if(obj == null){
                    repConnect.exportStatements(null, null, null, true, handler);
                }
                else{
                    repConnect.exportStatements(null, null, vf.createLiteral(obj), true, handler);
                }
            }
            else{
                if(obj == null){
                    repConnect.exportStatements(null, vf.createURI(pred), null, true, handler);
                }
                else{
                    repConnect.exportStatements(null, vf.createURI(pred), vf.createLiteral(obj), true, handler);
                }
            }
        }
        else{
            if(pred == null){
                if(obj == null){
                    repConnect.exportStatements(vf.createURI(subj), null, null, true, handler);
                }
                else{
                    repConnect.exportStatements(vf.createURI(subj), null, vf.createLiteral(obj), true, handler);
                }
            }
            else{
                if(obj == null){
                    repConnect.exportStatements(vf.createURI(subj), vf.createURI(pred), null, true, handler);
                }
                else{
                    repConnect.exportStatements(vf.createURI(subj), vf.createURI(pred), vf.createLiteral(obj), true, handler);
                }
            }
        }

        System.out.println("Exporting complete!");

    }
}