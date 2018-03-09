package com.mobi.catalog.api.record;

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

import com.mobi.catalog.api.record.config.RDFExportRecordConfig;
import com.mobi.rdf.api.Model;

import java.io.IOException;

public interface RDFExportService {

    /**
     * Exports data from the specified Repository based on the passed Configuration.
     *
     * @param config The configuration for the export with the OutputStream, RDFFormat, and optional restrictions
     * @param repositoryID The ID of the source Repository
     * @throws IOException Thrown if there is an error writing to the OutputStream
     * @throws IllegalArgumentException Thrown if the Repository does not exist
     */
    void export(RDFExportRecordConfig config, String repositoryID) throws IOException;

    /**
     * Exports the specified Model based on the passed Configuration.
     *
     * @param config The configuration for the export with the OutputStream and RDFFormat
     * @param model An RDF Model
     * @throws IOException Thrown if there is an error writing to the OutputStream
     */
    void export(RDFExportRecordConfig config, Model model) throws IOException;
}