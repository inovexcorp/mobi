package org.matonto.etl.api.csv;

import org.matonto.rdf.api.Model;
import org.openrdf.rio.RDFParseException;
import java.io.File;
import java.io.IOException;

public interface CSVConverter {

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
