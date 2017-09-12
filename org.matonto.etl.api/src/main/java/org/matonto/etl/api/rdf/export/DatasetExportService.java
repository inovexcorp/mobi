package org.matonto.etl.api.rdf.export;

/*-
 * #%L
 * org.matonto.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import org.matonto.etl.api.config.rdf.export.BaseExportConfig;

import java.io.IOException;

public interface DatasetExportService {

    /**
     * Exports data from the specified DatasetRecord's Dataset based on the passed Configuration.
     *
     * @param config The configuration for the export
     * @param datasetRecord The Resource ID of the DatasetRecord to export
     * @throws IllegalArgumentException Thrown if the DatasetRecord does not exist
     */
    void export(BaseExportConfig config, String datasetRecord) throws IOException;
}
