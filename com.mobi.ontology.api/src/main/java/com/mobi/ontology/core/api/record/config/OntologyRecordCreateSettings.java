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
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.query.api.Operation;
import com.mobi.rdf.api.Model;

import java.io.InputStream;
import java.util.Collections;
import java.util.Set;

public class OntologyRecordCreateSettings {

    public static OperationSetting<String> CATALOG_ID;
    public static OperationSetting<String> JSON;
    public static OperationSetting<InputStream> INPUT_STREAM;
    public static OperationSetting<String> RECORD_TITLE;
    public static OperationSetting<String> RECORD_DESCRIPTION;
    public static OperationSetting<Set<String>> RECORD_KEYWORDS;
    public static OperationSetting<Set<User>> RECORD_PUBLISHERS;

    public OntologyRecordCreateSettings() {
    }

    static {
        CATALOG_ID = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.catalogId"),
                "The catalogId of a Record object", null);
        JSON = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.json"),
                "The json model for the ontology", null);
        INPUT_STREAM = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.inputstream"),
                "The input stream file for the ontology", null);
        RECORD_TITLE = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.recordtitle"),
                "The title of a Record object", null);
        RECORD_DESCRIPTION = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.recorddescription"),
                "The description of a Record object", null);
        RECORD_KEYWORDS = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.recordkeywords"),
                "The keywords of a Record object", Collections.emptySet());
        RECORD_PUBLISHERS = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.recordpublishers"),
                "The publishers of a Record object", Collections.emptySet());
    }
}
