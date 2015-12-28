package org.matonto.etl.api.rdf;

import java.io.File;
import java.io.IOException;
import org.openrdf.model.Model;
import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.RDFFormat;

public interface RDFExportService {

    /**
     * This will export all triples from the specified repository to specified file.
     *
     * @param repositoryID The ID of the repository to export RDF data from
     * @param file The file to export the data to.
     * @throws RepositoryException Thrown if there is a problem connecting to the given repository
     * @throws IOException Thrown if there is an error writing to the file
     */
    void exportToFile (String repositoryID, File file) throws RepositoryException, IOException;


    /**
     * This will export triples, restricted by subject, predicate, and object, from a repository to a file.
     *
     * @param repositoryID The ID of the repository to export RDF data from
     * @param file The file to export the data to.
     * @param subj A subject that all exported triples will be restricted to
     * @param pred A predicate that all exported triples will be restricted to
     * @param objLit An object literal that all exported triples will be restricted to. Will only be used if objIRI is not passed
     * @param objIRI An object IRI that all exported triples will be restricted to. Takes precedence over objLit
     * @throws RepositoryException Thrown if there is a problem connecting to the given repository
     * @throws IOException Thrown if there is an error writing to the file
     */
    void exportToFile(String repositoryID, File file, String subj, String pred, String objIRI, String objLit) throws RepositoryException, IOException;

    /**
     * THis will export a model to a given file.
     *
     * @param model The model with triples to export
     * @param file The file to export the data to.
     * @throws RepositoryException if there is an error writing to the file
     * @throws IllegalArgumentException if there is an error processing the RDF file format from the file name
     */
    void exportToFile(Model model, File file) throws IOException;

    /**
     * This will export a model to a given file.
     *
     * @param model The model with triples to export
     * @param file The file to export the data to.
     * @param format The format of the rdf file to be exported
     * @throws RepositoryException if there is an error writing to the file
     */
    void exportToFile(Model model, File file, RDFFormat format) throws IOException;
}