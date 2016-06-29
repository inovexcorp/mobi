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

import java.io.File;
import java.io.IOException;

import org.matonto.rdf.api.Model;
import org.matonto.repository.exception.RepositoryException;
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
     * @throws IllegalArgumentException thrown if the repository does not exist
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
     * @throws IllegalArgumentException thrown if the repository does not exist
     */
    void importFile(String repositoryID,  File file, Boolean cont, RDFFormat format) throws IOException, RepositoryException, RDFParseException;

    /**
     * Import a model into a given repository
     * @param repositoryID the ID of the repository to import the triples from a model
     * @param m The rdf model to be imported
     * @throws IllegalArgumentException thrown if the repository does not exist
     * @throws RepositoryException thrown if there is a problem connecting to the given repository
     */
    void importModel(String repositoryID, Model m);
}