package com.mobi.etl.api.delimited;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.etl.api.config.delimited.ExcelConfig;
import com.mobi.etl.api.config.delimited.SVConfig;
import com.mobi.exception.MobiException;

import java.io.IOException;
import java.nio.file.Path;

public interface DelimitedConverter {
    /**
     * Converts a delimited SV file to an RDF file using a mapping. Column indexes for data
     * mappings are zero-based. Returns a Path to the RDF file.
     *
     * @param config Conversion configuration for the SV file
     * @return a Path to the RDF file
     * @throws IOException Thrown if there is a problem reading the file given
     * @throws MobiException Thrown if the file is not in a valid character set
     */
    Path convert(SVConfig config) throws IOException, MobiException;

    /**
     * Converts a Excel file to an RDF file using a mapping. Column indexes for data mappings
     * are zero-based. Returns a Path to the RDF file.
     *
     * @param config Conversion configuration for the Excel file
     * @return a Path to the RDF file
     * @throws IOException Thrown if there is a problem reading the file given
     * @throws MobiException Thrown if the file is not in a valid Excel format
     */
    Path convert(ExcelConfig config) throws IOException, MobiException;
}
