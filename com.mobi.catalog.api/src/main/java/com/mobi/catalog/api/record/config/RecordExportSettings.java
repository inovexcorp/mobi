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

import com.mobi.persistence.utils.BatchExporter;

/**
 * Base {@link com.mobi.catalog.api.ontologies.mcat.Record} export settings
 */
public class RecordExportSettings {

    /**
     * Setting for the {@link BatchExporter} to write Records out to.
     */
    public static OperationSetting<BatchExporter> BATCH_EXPORTER;

    private RecordExportSettings() {}

    static {
        BATCH_EXPORTER = new OperationSettingImpl<>("com.mobi.catalog.operation.export.batchexporter", "The BatchExporter to use for exporting Record data", null);
    }
}
