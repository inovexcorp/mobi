package com.mobi.catalog.api.record;

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

import com.mobi.catalog.api.VersionManager;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Reference;

public abstract class AbstractVersionedRecordService<T extends VersionedRecord>
        extends AbstractRecordService<T> implements RecordService<T> {

    @Reference
    public VersionManager versionManager;

    @Override
    protected void deleteRecord(T record, RepositoryConnection conn) {
        recordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(versionedRecord -> {
                    versionedRecord.getVersion_resource()
                            .forEach(resource -> versionManager.removeVersion(versionedRecord.getResource(), resource, conn));
                    deleteRecordObject(record, conn);
                });
    }
}
