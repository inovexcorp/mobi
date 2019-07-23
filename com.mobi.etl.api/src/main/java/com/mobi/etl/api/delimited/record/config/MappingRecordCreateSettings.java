package com.mobi.etl.api.delimited.record.config;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.record.config.OperationSetting;
import com.mobi.catalog.api.record.config.OperationSettingImpl;
import org.eclipse.rdf4j.rio.RDFFormat;

import java.io.InputStream;

public class MappingRecordCreateSettings {

    public static OperationSetting<InputStream> INPUT_STREAM;
    public static OperationSetting<RDFFormat> RDF_FORMAT;

    public MappingRecordCreateSettings() {}

    static {
        INPUT_STREAM = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.mapping.inputstream"),
                "The input stream file for the mapping", null);
        RDF_FORMAT = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.mapping.rdfformat"),
                "The RDF format of the input stream file for the mapping", null);
    }
}
