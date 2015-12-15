package org.matonto.etl.service.rdf;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Optional;
import org.matonto.etl.api.rdf.RDFExportService;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.Values;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.repository.base.RepositoryResult;
import org.openrdf.model.Model;
import org.openrdf.model.util.URIUtil;
import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.*;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;


@Component(provide = RDFExportService.class, immediate=true)
public class RDFExportServiceImpl implements RDFExportService {

    private RepositoryManager repositoryManager;

    private ValueFactory valueFactory;

    @Reference
    public void setRepositoryManager(RepositoryManager repositoryManager){this.repositoryManager = repositoryManager;}

    @Reference
    public void setValueFactory(ValueFactory valueFactory){this.valueFactory = valueFactory;}
    /**
     * Exports all info from the repository with the given repositoryID into the file specified.
     * @throws IOException
     */
    public void exportToFile(String repositoryID, File file) throws RepositoryException, IOException {
        exportToFile(repositoryID, file, null, null, null, null);
    }

    /**
     * Exports the rdf statements with the given subject, predicate, and object into the given file with a given filetype.
     * Enter null in the subj, pred, and obj fields if you don't want to filter by a particular value
     */
    public void exportToFile(String repositoryID, File file, String subj, String pred, String objIRI, String objLit) throws RepositoryException, IOException {

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

        if(!file.canWrite())
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

            Rio.write(m, new FileWriter(file), format);

        }else{
            throw new IllegalArgumentException("Repository does not exist");
        }

    }
}