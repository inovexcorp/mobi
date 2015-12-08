package org.matonto.etl.service.rdf;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

import org.apache.log4j.Logger;
import org.matonto.etl.api.rdf.RDFExportService;
import org.openrdf.model.Resource;
import org.openrdf.model.URI;
import org.openrdf.model.Value;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.impl.ValueFactoryImpl;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.*;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;


@Component(provide = RDFExportService.class, immediate=true)
public class RDFExportServiceImpl implements RDFExportService {

    private Repository repository;

    private RepositoryConnection repConnect;

    private static final Logger LOGGER = Logger.getLogger(RDFExportServiceImpl.class);


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
        LOGGER.info("Repository connected!");

        RDFFormat format = Rio.getWriterFormatForFileName(file.getName());
        RDFWriter rdfWriter = Rio.createWriter(format, new FileWriter(file.getAbsoluteFile()));

        repConnect.export(rdfWriter);

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
        LOGGER.info("Repository connected!");

        RDFFormat format = Rio.getWriterFormatForFileName(file.getName());
        RDFWriter rdfWriter = Rio.createWriter(format, new FileWriter(file.getAbsoluteFile()));

        Resource subjResource = null;
        URI predicateURI = null;
        Value objValue = null;
        if(subj != null)
            subjResource = vf.createURI(subj);
        if(pred != null)
            predicateURI = vf.createURI(pred);
        if(obj != null) {
            try {
                objValue = vf.createURI(obj);
            }catch(IllegalArgumentException e){
                objValue = vf.createLiteral(obj);
            }
        }

        repConnect.exportStatements(subjResource,predicateURI,objValue, true, rdfWriter);

        LOGGER.info("Exporting complete!");

    }
}