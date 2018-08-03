package com.mobi.ontology.core.api.record.config;

/*-
 * #%L
 * com.mobi.ontology.core.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import java.io.InputStream;

public class OntologyRecordCreateSettings {

    public static OperationSetting<InputStream> INPUT_STREAM;

    public OntologyRecordCreateSettings() {
    }

    static {
        INPUT_STREAM = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.inputstream"),
                "The input stream file for the ontology", null);
    }
}
