package org.matonto.etl.api.rdf;

/*-
 * #%L
 * org.matonto.etl.api
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

import org.matonto.etl.api.config.rdf.ImportServiceConfig;
import org.matonto.rdf.api.Model;
import org.matonto.repository.exception.RepositoryException;
import org.openrdf.rio.RDFParseException;

import java.io.File;
import java.io.IOException;

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
     * Imports a Model into a specific Repository or DatasetRecord depending on the provided configuration.
     *
     * @param config The configuration for the import specifying the target
     * @param model An RDF Model to import
     * @throws IllegalArgumentException thrown if the Repository or DatasetRecord does not exist
     * @throws RepositoryException thrown if there is a problem connecting to the specified Repository or the
     *      Dataset of the specified DatasetRecord
     */
    void importModel(ImportServiceConfig config, Model model);
}