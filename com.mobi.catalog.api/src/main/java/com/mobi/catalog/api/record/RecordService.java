package com.mobi.catalog.api.record;

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

import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.RecordExportConfig;
import com.mobi.rdf.api.IRI;
import com.mobi.repository.api.RepositoryConnection;

public interface RecordService<T extends Record> {

    /**
     * Exports a given Record based on a provided configuration
     *
     * @param iriRecord An {@link IRI} of the record to be exported
     * @param config A {@link RecordExportConfig} that contains the export configuration.
     */
    <T extends RecordExportConfig> void export(IRI iriRecord, T config, RepositoryConnection conn);

}
