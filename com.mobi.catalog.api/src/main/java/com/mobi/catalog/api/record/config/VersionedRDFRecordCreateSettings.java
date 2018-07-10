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

import com.mobi.rdf.api.Model;

/**
 * {@link com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord} create settings.
 */
public class VersionedRDFRecordCreateSettings {

    /**
     * Boolean setting for whether or not to write out versioned RDF data.
     */
    public static OperationSetting<Model> INITIAL_COMMIT_DATA;

    private VersionedRDFRecordCreateSettings() {}

    static {
        INITIAL_COMMIT_DATA = new OperationSettingImpl<>("com.mobi.catalog.operation.create.initialcommitdata",
                "Data for initial commit", null);
    }
}
