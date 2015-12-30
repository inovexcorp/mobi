package org.matonto.etl.api.csv;

import org.matonto.rdf.api.Model;
import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.RDFParseException;

import java.io.File;
import java.io.IOException;

public interface CSVConverter {

    /**
     * Import a CSV file and load it into the MatOnto Framework
     *
     * @param csv         The csv file to be loaded
     * @param mappingFile A mapping file to map the CSV data to MatOnto Ontologies. See the MatOnto Wiki for details
     * @param repoID      The repository ID for where to load the RDF
     * @throws RDFParseException   Thrown if there is a problem parsing the mapping file
     * @throws IOException         Thrown if there is a problem reading one of the files given
     * @throws RepositoryException Thrown when the service cannot connect to the MatOnto Repository
     */
    void importCSV(File csv, File mappingFile, String repoID)  throws RDFParseException, IOException, RepositoryException;

    /**
     * Import a CSV file and load it into the MatOnto Framework. Mappings are already in an RDF Model
     *
     * @param csv          The csv file to be loaded
     * @param mappingModel The mapping of CSV to MatOnto Ontologies in an RDF Model. See the MatOnto Wiki for details
     * @param repoID       The repository ID for where to load the RDF
     * @throws IOException         Thrown if there is a problem reading a given file
     * @throws RepositoryException Thrown if there is a problem loading data into the repository
     */
    void importCSV(File csv, Model mappingModel, String repoID) throws IOException, RepositoryException;

    /**
     * Converts a CSV to RDF using a mapping file. Exports the resulting RDF to a file
     * @param csv          The CSV file to be loaded
     * @param mappingFile  An RDF file of the mapping to CSV. See MatOnto Wiki for details.
     * @param exportFile   The file where the converted RDF should be written to
     * @throws IOException Thrown if there is a problem reading any of the files or writting the output file
     */
    void exportCSV(File csv, File mappingFile, File exportFile) throws IOException;

    /**
     * Converts a CSV to RDF using a mapping file in a model. Exports the resulting RDF to a file
     * @param csv          The CSV file to be loaded
     * @param mappingModel An RDF Model of the mapping to CSV. See MatOnto Wiki for details.
     * @param exportFile   The file where the converted RDF should be written to
     * @throws IOException Thrown if there is a problem reading any of the files or writting the output file
     */
    void exportCSV(File csv, Model mappingModel, File exportFile) throws IOException;

    /**
     * Converts a CSV to RDF using a mapping file. Returns the RDF data as a Model
     *
     * @param csv         The CSV file to be loaded
     * @param mappingFile The mapping file in RDF Format. See the MatOnto Wiki for details
     * @return A Model of RDF data converted from CSV
     * @throws IOException       Thrown if there is a problem reading the files given
     * @throws RDFParseException Thrown if there is an issue parsing the RDF mapping file
     */
    Model convert(File csv, File mappingFile) throws IOException, RDFParseException;

    /**
     * Converts a CSV to RDF using a mapping file. Returns the RDF data as a Model
     *
     * @param csv          The CSV file to be loaded
     * @param mappingModel An RDF Model of the mapping to CSV. See MatOnto Wiki for details.
     * @return A Model of RDF data converted from CSV
     * @throws IOException Thrown if there is a problem reading the files given
     */
    Model convert(File csv, Model mappingModel) throws IOException;

}
