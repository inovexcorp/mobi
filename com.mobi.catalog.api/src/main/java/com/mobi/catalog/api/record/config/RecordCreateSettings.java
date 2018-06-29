package com.mobi.catalog.api.record.config;

/*-
 * #%L
 * com.mobi.catalog.api
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

import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.BatchInserter;

import java.util.Set;

/**
 * Base {@link com.mobi.catalog.api.ontologies.mcat.Record} insert settings.
 */
public class RecordCreateSettings {

    public static OperationSetting<String> RECORD_TITLE;
    public static OperationSetting<String> RECORD_DESCRIPTION;
    public static OperationSetting<Set<String>>RECORD_KEYWORDS;
    public static OperationSetting<Set<User>> RECORD_PUBLISHERS;


    public RecordCreateSettings() {
    }

    static {
        RECORD_TITLE = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.recordtitle"),
                "The title of a Record object", null);
        RECORD_DESCRIPTION = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.recorddescription"),
                "The description of a Record object", null);
        RECORD_KEYWORDS = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.recordkeywords"),
                "The keywords of a Record object", null);
        RECORD_PUBLISHERS = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.recordpublishers"),
                "The publishers of a Record object", null);
    }
}
