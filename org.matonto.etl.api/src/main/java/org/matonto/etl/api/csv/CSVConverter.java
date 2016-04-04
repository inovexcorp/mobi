package org.matonto.etl.api.csv;

import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.matonto.rdf.api.Model;
import org.openrdf.rio.RDFParseException;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

public interface CSVConverter {

    /**
     * Converts a delimited file to RDF using a mapping file. Optionally skip a header row. Column
     * indexes for data mappings are zero-based. Returns the RDF data as a Model.
     *
     * @param delim The delimited file to be loaded
     * @param mappingFile The mapping file in RDF Format. See the MatOnto Wiki for details
     * @param containsHeaders Whether or not the delimited file contains a header row
     * @return A Model of RDF data converted from delimited data
     * @throws IOException Thrown if there is a problem reading the files given
     * @throws RDFParseException Thrown if there is an issue parsing the RDF mapping file
     */
    Model convert(File delim, File mappingFile, boolean containsHeaders)
            throws IOException, RDFParseException, InvalidFormatException;

    /**
     * Converts a delimited file to RDF using a mapping Model. Optionally skip a header row. Column
     * indexes for data mappings are zero-based. Returns the RDF data as a Model.
     *
     * @param delim The delimited file to be loaded
     * @param mappingModel An RDF Model of the mapping to delimited data. See MatOnto Wiki for details.
     * @param containsHeaders Whether or not the delimited file contains a header row
     * @return A Model of RDF data converted from delimited data
     * @throws IOException Thrown if there is a problem reading the files given
     */
    Model convert(File delim, Model mappingModel, boolean containsHeaders) throws IOException, InvalidFormatException;

    /**
     * Converts a delimited file to RDF using a mapping file. Optionally skip a header row. Column
     * indexes for data mappings are zero-based. Returns the RDF data as a Model.
     *
     * @param delim The delimited InputStream to be loaded
     * @param mappingFile The mapping file in RDF Format. See the MatOnto Wiki for details
     * @param containsHeaders Whether or not the delimited file contains a header row
     * @param extension The extension of the delimited file
     * @return A Model of RDF data converted from delimited data
     * @throws IOException Thrown if there is a problem reading the files given
     * @throws RDFParseException Thrown if there is an issue parsing the RDF mapping file
     */
    Model convert(InputStream delim, File mappingFile, boolean containsHeaders, String extension)
            throws IOException, InvalidFormatException;

    /**
     * Converts a delimited file to RDF using a mapping Model. Optionally skip a header row. Column
     * indexes for data mappings are zero-based. Returns the RDF data as a Model.
     *
     * @param delim The delimited InputStream to be loaded
     * @param mappingModel An RDF Model of the mapping to delimited data. See MatOnto Wiki for details.
     * @param containsHeaders Whether or not the delimited file contains a header row
     * @param extension The extension of the delimited file
     * @return A Model of RDF data converted from delimited data
     * @throws IOException Thrown if there is a problem reading the files given
     */
    Model convert(InputStream delim, Model mappingModel, boolean containsHeaders, String extension)
            throws IOException, InvalidFormatException;
}
