package org.matonto.etl.api.rdf;

import java.io.File;
import java.io.IOException;
import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.RDFHandlerException;

/**
 * Created by bryan on 9/10/15.
 */
public interface RDFExportService {

    /**
     * This will export all triples from the specified repository to specified file.
     *
     * @param repositoryID The ID of the repository to export RDF data from
     * @param file The file to export the data to.
     * @throws Exception
     * @throws IOException
     * @throws RDFHandlerException
     * @throws RepositoryException
     */
    public void exportToFile (String repositoryID, File file) throws RepositoryException, RDFHandlerException, IOException, Exception;


    /**
     * This will export triples, restricted by subject, predicate, and object, from a repository to a file.
     *
     * @param repositoryID The ID of the repository to export RDF data from
     * @param file The file to export the data to.
     * @param subj A subject that all exported triples will be restricted to
     * @param pred A predicate that all exported triples will be restricted to
     * @param obj An object that all exported triples will be restricted to
     */
    public void exportToFile(String repositoryID, File file, String filetype, String subj, String pred, String obj) throws RepositoryException, RDFHandlerException, IOException, Exception;

}