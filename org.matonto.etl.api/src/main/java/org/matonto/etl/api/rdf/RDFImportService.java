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

import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.repository.exception.RepositoryException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;

import java.io.File;
import java.io.IOException;

public interface RDFImportService {

    /**
     * Imports an RDF File to a specified Repository.
     *
     * @param repositoryID The id of the target Repository
     * @param file An RDF file to import
     * @param cont An option to continue import with next triple if error occurs. Warnings will be given.
     * @throws RDFParseException thrown if there is a problem parsing the RDF file
     * @throws RepositoryException thrown if there is a problem connecting to the specified Repository
     * @throws IOException thrown if there is a problem reading the File or the File could not be found
     * @throws IllegalArgumentException thrown if the Repository does not exist
     */
    void importFile(String repositoryID, File file, Boolean cont) throws IOException;

    /**
     * Imports an RDF File with a specified format to a specified Repository.
     *
     * @param repositoryID The id of the target Repository
     * @param file An RDF file to import
     * @param cont An option to continue import with next triple if error occurs. Warnings will be given.
     * @param format The RDF format of the imported file
     * @throws RDFParseException thrown if there is a problem parsing the RDF File
     * @throws RepositoryException thrown if there is a problem connecting to the specified Repository
     * @throws IOException thrown if there is a problem reading the File or the File could not be found
     * @throws IllegalArgumentException thrown if the Repository does not exist
     */
    void importFile(String repositoryID, File file, Boolean cont, RDFFormat format) throws IOException;

    /**
     * Imports an RDF Fileto a specified DatasetRecord's Dataset.
     *
     * @param datasetRecordID The id of the DatasetRecord with the target Dataset
     * @param file An RDF file to import
     * @param cont An option to continue import with next triple if error occurs. Warnings will be given.
     * @throws RDFParseException thrown if there is a problem parsing the RDF file
     * @throws IOException thrown if there is a problem reading the file or the file could not be found
     * @throws IllegalArgumentException thrown if the DatasetRecord does not exist
     * @throws RepositoryException thrown if there is a problem connecting to the Dataset of the
     *      specified DatasetRecord
     */
    void importFile(Resource datasetRecordID, File file, Boolean cont) throws IOException;

    /**
     * Imports an RDF File with a specified format to a specified DatasetRecord's Dataset.
     *
     * @param datasetRecordID The id of the DatasetRecord with the target Dataset
     * @param file An RDF file to import
     * @param cont An option to continue import with next triple if error occurs. Warnings will be given.
     * @param format The RDF format of the imported file
     * @throws RDFParseException thrown if there is a problem parsing the RDF file
     * @throws IOException thrown if there is a problem reading the file or the file could not be found
     * @throws IllegalArgumentException thrown if the DatasetRecord does not exist
     * @throws RepositoryException thrown if there is a problem connecting to the Dataset of the
     *      specified DatasetRecord
     */
    void importFile(Resource datasetRecordID, File file, Boolean cont, RDFFormat format) throws IOException;

    /**
     * Imports a Model into a specified Repository.
     *
     * @param repositoryID The id of the target Repository
     * @param model An RDF Model to import
     * @throws IllegalArgumentException thrown if the repository does not exist
     * @throws RepositoryException thrown if there is a problem connecting to the given repository
     */
    void importModel(String repositoryID, Model model);

    /**
     * Imports a Model into a specified DatasetRecord's Dataset.
     *
     * @param datasetRecordID The id of the DatasetRecord with the target Dataset
     * @param model An RDF Model to import
     * @throws IllegalArgumentException thrown if the DatasetRecord does not exist
     * @throws RepositoryException thrown if there is a problem connecting to the Dataset of the
     *      specified DatasetRecord
     */
    void importModel(Resource datasetRecordID, Model model);
}