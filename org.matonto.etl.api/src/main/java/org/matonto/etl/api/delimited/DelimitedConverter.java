package org.matonto.etl.api.delimited;

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

import org.matonto.etl.api.config.delimited.ExcelConfig;
import org.matonto.etl.api.config.delimited.SVConfig;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Model;

import java.io.IOException;

public interface DelimitedConverter {
    /**
     * Converts a delimited SV file to RDF using a mapping. Column indexes for data
     * mappings are zero-based. Returns the RDF data as a Model.
     *
     * @param config Conversion configuration for the SV file
     * @return A Model of RDF data converted from delimited data
     * @throws IOException Thrown if there is a problem reading the file given
     * @throws MatOntoException Thrown if the file is not in a valid character set
     */
    Model convert(SVConfig config) throws IOException, MatOntoException;

    /**
     * Converts a Excel file to RDF using a mapping. Column indexes for data mappings
     * are zero-based. Returns the RDF data as a Model.
     *
     * @param config Conversion configuration for the Excel file
     * @return A Model of RDF data converted from delimited data
     * @throws IOException Thrown if there is a problem reading the file given
     * @throws MatOntoException Thrown if the file is not in a valid Excel format
     */
    Model convert(ExcelConfig config) throws IOException, MatOntoException;
}
