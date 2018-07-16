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

import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.repository.api.RepositoryConnection;

public abstract class AbstractUnversionedRecordService <T extends UnversionedRecord>
        extends AbstractRecordService<T> implements RecordService<T> {

    @Override
    protected void deleteRecord(T record, RepositoryConnection conn) {
        recordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(unversionedRecord -> {
                    unversionedRecord.getUnversionedDistribution_resource().forEach(resource ->
                            utilsService.remove(resource, conn));
                    deleteRecordObject(record, conn);
                });
    }
}
