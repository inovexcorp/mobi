package org.matonto.etl.api.rdf;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;

import org.matonto.repository.exception.RepositoryException;
import org.openrdf.model.Model;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;

public interface RDFImportService {

    /**
     * Imports a triple file to a specified repository.
     * @param repositoryID The id of the repository to import triples to
     * @param file The file to import triples from
     * @param cont An option to continue import with next triple if error occurs. Warnings will be given.
     * @throws RDFParseException thrown if there is a problem parsing the RDF file
     * @throws RepositoryException thrown if there is a problem connecting to the given repository
     * @throws IOException thrown if there is a problem reading the file
     */
    void importFile(String repositoryID,  File file, Boolean cont) throws IOException, RepositoryException, RDFParseException;

    /**
     * Imports a triple file to a specified repository.
     * @param repositoryID The id of the repository to import triples to
     * @param file The file to import triples from
     * @param cont An option to continue import with next triple if error occurs. Warnings will be given.
     * @param format The file format for the imported file
     * @throws RDFParseException thrown if there is a problem parsing the RDF file
     * @throws RepositoryException thrown if there is a problem connecting to the given repository
     * @throws IOException thrown if there is a problem reading the file
     */
    void importFile(String repositoryID,  File file, Boolean cont, RDFFormat format) throws IOException, RepositoryException, RDFParseException;

    /**
     * Import a model into a given repository
     * @param repositoryID the ID of the repository to import the triples from a model
     * @param m The rdf model to be imported
     */
    void importModel(String repositoryID, Model m);
}