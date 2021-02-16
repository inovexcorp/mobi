package com.mobi.etl.api.rdf;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.exception.RepositoryException;
import org.eclipse.rdf4j.rio.RDFParseException;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

public interface RDFImportService {

    /**
     * Imports an RDF File to a specific Repository or DatasetRecord depending on the provided configuration.
     *
     * @param config The configuration for the import specifying the target
     * @param file An RDF file to import
     * @throws RDFParseException thrown if there is a problem parsing the RDF file
     * @throws RepositoryException thrown if there is a problem connecting to the specified Repository or the
     *      Dataset of the specified DatasetRecord
     * @throws IOException thrown if there is a problem reading the File or the File could not be found
     * @throws IllegalArgumentException thrown if the Repository or DatasetRecord does not exist
     */
    void importFile(ImportServiceConfig config, File file) throws IOException;

    /**
     * Imports an RDF File to a specific Repository. Imports statements directly into the provided graph.
     *
     * @param config The configuration for the import specifying the target
     * @param file An RDF file to import
     * @param graph The Resource representing the named graph to insert statements into
     * @throws RDFParseException thrown if there is a problem parsing the RDF file
     * @throws IOException thrown if there is a problem reading the File or the File could not be found
     * @throws IllegalArgumentException thrown if the Repository or DatasetRecord does not exist
     */
    void importFile(ImportServiceConfig config, File file, Resource graph) throws IOException;

    /**
     * Imports a Model into a specific Repository or DatasetRecord depending on the provided configuration.
     *
     * @param config The configuration for the import specifying the target
     * @param model An RDF Model to import
     * @throws IllegalArgumentException thrown if the Repository or DatasetRecord does not exist
     * @throws RepositoryException thrown if there is a problem connecting to the specified Repository or the
     *      Dataset of the specified DatasetRecord
     */
    void importModel(ImportServiceConfig config, Model model);

    /**
     * Imports an InputStream of RDF data to a specific Repository or DatasetRecord depending on the provided
     * configuration. The configuration must have a format set to import the InputStream correctly.
     *
     * @param config The configuration for the import specifying the target
     * @param stream An InputStream of serialized RDF data
     * @throws RDFParseException thrown if there is a problem parsing the RDF InputStream
     * @throws RepositoryException thrown if there is a problem connecting to the specified Repository or the
     *      Dataset of the specified DatasetRecord
     * @throws IOException thrown if there is a problem reading the InputStream
     * @throws IllegalArgumentException thrown if the Repository or DatasetRecord does not exist
     */
    void importInputStream(ImportServiceConfig config, InputStream stream) throws IOException;
}