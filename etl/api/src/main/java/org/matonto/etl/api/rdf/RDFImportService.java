package org.matonto.etl.api.rdf;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;

import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;

/**
 * Created by bryan on 9/10/15.
 */
public interface RDFImportService {

    /**
     * Imports a triple file to a specified repository.
     * @param repositoryID The id of the repository to import triples to
     * @param file The file to import triples from
     * @param cont An option to continue import with next triple if error occurs. Warnings will be given.
     * @throws FileNotFoundException
     * @throws RDFParseException
     * @throws RepositoryException
     * @throws IOException
     */
    public void importFile(String repositoryID,  File file, Boolean cont) throws FileNotFoundException, IOException, RepositoryException, RDFParseException;

    /**
     * Imports a triple file to a specified repository.
     * @param repositoryID The id of the repository to import triples to
     * @param file The file to import triples from
     * @param cont An option to continue import with next triple if error occurs. Warnings will be given.
     * @param format The file format for the imported file
     */

    public void importFile(String repositoryID,  File file, Boolean cont, RDFFormat format) throws FileNotFoundException, IOException, RepositoryException, RDFParseException;


}