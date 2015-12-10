package org.matonto.etl.service.rdf;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.Optional;

import org.apache.log4j.Logger;
import org.matonto.etl.api.rdf.RDFImportService;
import org.matonto.rdf.core.impl.sesame.Values;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.api.Repository;
import org.matonto.repository.exception.RepositoryConfigException;
import org.matonto.repository.exception.RepositoryException;
import org.openrdf.model.Model;
import org.openrdf.model.Statement;
import org.matonto.rdf.core.impl.sesame.LinkedHashModel;
import org.openrdf.rio.*;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.openrdf.rio.helpers.StatementCollector;
import javax.annotation.Nonnull;

@Component(provide = RDFImportService.class, immediate = true)
public class RDFImportServiceImpl implements RDFImportService {

    private RepositoryManager repositoryManager;

    private static final Logger LOGGER = Logger.getLogger(RDFImportServiceImpl.class);

    @Reference
    public void setRepositoryManager(RepositoryManager repositoryManager){this.repositoryManager = repositoryManager;}

    /**
     * Imports a file into the openrdf repository (with the given repositoryID) deployed on karaf
     * @throws FileNotFoundException
     */
    public void importFile(String repositoryID, @Nonnull File file, Boolean cont) throws IOException, RepositoryException, RDFParseException {

        if(!file.exists())
            throw new IOException("File not found");

        //Get the rdf format based on the file name. If the format returns null, it is an unsupported file type.
        RDFFormat format = Rio.getParserFormatForFileName(file.getName()).orElseThrow(() -> new IOException("Unsupported file type"));

        importFile(repositoryID,file, cont, format);

    }

    /**
     * Imports a file with a specified format into the openrdf repository (with the given repositoryID) deployed on karaf
     */
    public void importFile(String repositoryID, @Nonnull File file, Boolean cont,@Nonnull RDFFormat format) throws IOException, RepositoryException, RDFParseException {

        if(!file.exists())
            throw new IOException("File not found");

        RDFParser parser = Rio.createParser(format);
        Model m = new org.openrdf.model.impl.LinkedHashModel();
        parser.setRDFHandler(new StatementCollector(m));
        try {
            parser.parse(new FileReader(file), "");
        }catch(RDFHandlerException e){
            throw new RDFParseException(e);
        }

        storeModel(repositoryID, m);

    }

    private void storeModel(String repositoryID, Model m){
        Optional<Repository> optRepo = repositoryManager.getRepository(repositoryID);
        if(optRepo.isPresent()){
            org.matonto.rdf.api.Model matontoModel = m.stream()
                    .map(Values::matontoStatement)
                    .collect(LinkedHashModel::new,LinkedHashModel::add,LinkedHashModel::addAll);
            RepositoryConnection conn = optRepo.get().getConnection();
            conn.add(matontoModel);

        }else{
            throw new IllegalArgumentException("Repository does not exist");
        }
    }

}