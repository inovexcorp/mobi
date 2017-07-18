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
import org.openrdf.rio.RDFFormat;

import java.io.File;
import java.io.IOException;

public interface RDFExportService {

    /**
     * Exports all triples from the specified Repository to the specified File in the RDF format determined
     * by the file name.
     *
     * @param repositoryID The ID of the source Repository
     * @param filePath The path to the target File
     * @return A File with the result of the export
     * @throws IOException Thrown if there is an error writing to the file or the RDF format could not be determined
     *      from the file name
     * @throws IllegalArgumentException Thrown if the Repository does not exist
     */
    File exportToFile(String repositoryID, String filePath) throws IOException;

    /**
     * Exports triples, restricted by subject, predicate, and object, from the specified Repository
     * to the specified File.
     *
     * @param repositoryID The ID of the source Repository
     * @param filePath The path to the target File
     * @param subj A subject to restrict all exported triples
     * @param pred A predicate to restrict all exported triples
     * @param objLit An object literal to restrict all exported triples. Will only be used if objIRI is not passed
     * @param objIRI An object IRI to restrict all exported triples. Takes precedence over objLit
     * @return A File with the result of the export
     * @throws IOException Thrown if there is an error writing to the file or the RDF format could not be determined
     *      from the file name
     * @throws IllegalArgumentException Thrown if the Repository does not exist
     */
    File exportToFile(String repositoryID, String filePath, String subj, String pred, String objIRI, String objLit)
            throws IOException;

    /**
     * Exports all triples from the specified DatasetRecord's Dataset to the specified File.
     *
     * @param datasetRecordID The ID of the DatasetRecord with the target Dataset
     * @param filePath The path to the target File
     * @return A File with the result of the export
     * @throws IOException Thrown if there is an error writing to the file or the RDF format could not be determined
     *      from the file name
     * @throws IllegalArgumentException Thrown if the DatasetRecord does not exist
     */
    File exportToFile(Resource datasetRecordID, String filePath) throws IOException;

    /**
     * Exports triples, restricted by subject, predicate, and object, from the specified DatasetRecord's
     * Dataset to the specified File.
     *
     * @param datasetRecordID The ID of the DatasetRecord with the target Dataset
     * @param filePath The path to the target File
     * @param subj A subject to restrict all exported triples
     * @param pred A predicate to restrict all exported triples
     * @param objIRI An object literal to restrict all exported triples. Will only be used if objIRI is not passed
     * @param objLit An object IRI to restrict all exported triples. Takes precedence over objLit
     * @return A File with the result of the export
     * @throws IOException Thrown if there is an error writing to the file or the RDF format could not be determined
     *      from the file name
     * @throws IllegalArgumentException Thrown if the DatasetRecord does not exist
     */
    File exportToFile(Resource datasetRecordID, String filePath, String subj, String pred, String objIRI,
                      String objLit) throws IOException;

    /**
     * Exports the specified Model to the specified File in the RDF format determined by the file name.
     *
     * @param model An RDF Model
     * @param filePath The path to the target File to export the data to.
     * @return A File with the result of the export
     * @throws IOException Thrown if there is an error writing to the file or the RDF format could not be determined
     *      from the file name
     */
    File exportToFile(Model model, String filePath) throws IOException;

    /**
     * Exports a model to the specified File in the specified RDF format.
     *
     * @param model An RDF model
     * @param filePath The path to the target File
     * @param format The RDF format for the exported file
     * @return A File with the result of the export
     * @throws IOException Thrown if there is an error writing to the file
     */
    File exportToFile(Model model, String filePath, RDFFormat format) throws IOException;
}