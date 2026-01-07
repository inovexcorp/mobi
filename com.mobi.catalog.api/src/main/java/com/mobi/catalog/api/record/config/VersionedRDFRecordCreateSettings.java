package com.mobi.catalog.api.record.config;

/*-
 * #%L
 * com.mobi.catalog.api
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

import org.eclipse.rdf4j.model.Model;

import java.io.InputStream;

/**
 * {@link com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord} create settings.
 */
public class VersionedRDFRecordCreateSettings {

    /**
     * Boolean setting for whether to write out versioned RDF data.
     */
    public static OperationSetting<Model> INITIAL_COMMIT_DATA;

    /**
     * Setting for passing in an InputStream.
     */
    public static OperationSetting<InputStream> INPUT_STREAM;

    /**
     * Setting for the file name associated with the provided InputStream.
     */
    public static OperationSetting<String> FILE_NAME;

    private VersionedRDFRecordCreateSettings() {}

    static {
        INITIAL_COMMIT_DATA = new OperationSettingImpl<>("com.mobi.catalog.operation.create.initialcommitdata",
                "Data for initial commit", null);
        INPUT_STREAM = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.inputstream"),
                "The input stream file for the RDF", null);
        FILE_NAME = new OperationSettingImpl<>(("com.mobi.catalog.operation.create.filename"),
                "The file name for the RDF input stream", null);
    }
}
