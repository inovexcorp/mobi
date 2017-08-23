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

import org.matonto.etl.api.config.RDFExportConfig;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

import java.io.File;
import java.io.IOException;

public interface RDFExportService {

    /**
     * Exports triples from the specified Repository to the specified File optionally restricted based on the
     * passed Configuration.
     *
     * @param config The configuration for the export with the file path, RDF format, and optional restrictions
     * @param repositoryID The ID of the source Repository
     * @return A File with the result of the export
     * @throws IOException Thrown if there is an error writing to the file or the RDF format could not be determined
     *      from the file name
     * @throws IllegalArgumentException Thrown if the Repository does not exist
     */
    File exportToFile(RDFExportConfig config, String repositoryID) throws IOException;

    /**
     * Exports triples from the specified DatasetRecord's Dataset to the specified File optionally restricted
     * based on the passed Configuration.
     *
     * @param config The configuration for the export with the file path, RDF format, and optional restrictions
     * @param datasetRecordID The ID of the DatasetRecord with the target Dataset
     * @return A File with the result of the export
     * @throws IOException Thrown if there is an error writing to the file or the RDF format could not be determined
     *      from the file name
     * @throws IllegalArgumentException Thrown if the DatasetRecord does not exist
     */
    File exportToFile(RDFExportConfig config, Resource datasetRecordID) throws IOException;

    /**
     * Exports the specified Model to the specified File based on the passed Configuration.
     *
     * @param config The configuration for the export with the file path and RDF format
     * @param model An RDF Model
     * @return A File with the result of the export
     * @throws IOException Thrown if there is an error writing to the file or the RDF format could not be determined
     *      from the file name
     */
    File exportToFile(RDFExportConfig config, Model model) throws IOException;
}