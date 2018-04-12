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

import com.mobi.rdf.api.Resource;

import java.util.HashSet;
import java.util.Set;

public class VersionedRDFRecordExportSettings {

    public static OperationSetting<Boolean> WRITE_VERSIONED_DATA;
    public static OperationSetting<Set<Resource>> BRANCHES_TO_EXPORT;

    private VersionedRDFRecordExportSettings() {}

    static {
        WRITE_VERSIONED_DATA = new OperationSettingImpl<>("com.mobi.catalog.operation.export.writeversioneddata", "Write versioned RDF data", true);
        BRANCHES_TO_EXPORT = new OperationSettingImpl<>("com.mobi.catalog.operation.export.branchestoexport", "Branches to export", new HashSet<>());
    }
}
