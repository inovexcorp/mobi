package org.matonto.etl.service.rdf;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Optional;

import org.apache.log4j.Logger;
import org.matonto.etl.api.rdf.RDFExportService;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.base.RepositoryResult;
import org.openrdf.model.Model;
import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.*;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;


@Component(provide = RDFExportService.class, immediate=true)
public class RDFExportServiceImpl implements RDFExportService {

    private static final Logger LOGGER = Logger.getLogger(RDFExportServiceImpl.class);

    private RepositoryManager repositoryManager;

    private ValueFactory valueFactory;

    @Reference
    public void setRepositoryManager(RepositoryManager repositoryManager){this.repositoryManager = repositoryManager;}

    @Reference
    public void setValueFactory(ValueFactory valueFactory){this.valueFactory = valueFactory;}

    @Override
    public File exportToFile(String repositoryID, String filepath) throws RepositoryException, IOException {
        return exportToFile(repositoryID, filepath, null, null, null, null);
    }

    @Override
    public File exportToFile(String repositoryID, String filepath, String subj, String pred, String objIRI, String objLit) throws RepositoryException, IOException {

        File file = new File(filepath);

        Resource subjResource = null;
        IRI predicateIRI = null;
        Value objValue = null;
        if(subj != null)
            subjResource = valueFactory.createIRI(subj);
        if(pred != null)
            predicateIRI = valueFactory.createIRI(pred);
        if(objIRI != null){
            objValue = valueFactory.createIRI(objIRI);
        }else if(objLit != null) {
            objValue = valueFactory.createLiteral(objLit);
        }

        LOGGER.warn("Restricting to:\nSubj: " + subjResource + "\nPred: " + predicateIRI + "\n"
                    +"Obj: " + objValue);

        if(file.exists() && !file.canWrite())
            throw new IOException("Unable to write to file");

        RDFFormat format = Rio.getParserFormatForFileName(file.getName()).orElseThrow(() -> new IOException("Unsupported file type"));

        Optional<org.matonto.repository.api.Repository> optRepo = repositoryManager.getRepository(repositoryID);

        if(optRepo.isPresent()){
            Repository repo = optRepo.get();
            RepositoryConnection conn = repo.getConnection();
            RepositoryResult<org.matonto.rdf.api.Statement> result = conn.getStatements(subjResource, predicateIRI, objValue);

            Model m = new org.openrdf.model.impl.LinkedHashModel();
            result.forEach((s)->{
                m.add(Values.sesameStatement(s));
            });

            return exportToFile(m, filepath, format);

        }else{
            throw new IllegalArgumentException("Repository does not exist");
        }

    }

    @Override
    public File exportToFile(Model model, String filepath) throws IOException{

        Optional<RDFFormat> optFormat = Rio.getWriterFormatForFileName(filepath);
        if(optFormat.isPresent()){
            return exportToFile(model, filepath, optFormat.get());
        }else{
            throw new IllegalArgumentException("File format not supported");
        }
    }

    @Override
    public File exportToFile(Model model, String filepath, RDFFormat format) throws IOException{
        File file = new File(filepath);
        Rio.write(model, new FileWriter(file), format);
        return file;
    }


}