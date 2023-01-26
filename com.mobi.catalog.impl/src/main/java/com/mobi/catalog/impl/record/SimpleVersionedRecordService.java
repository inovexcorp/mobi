package com.mobi.catalog.impl.record;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecordFactory;
import com.mobi.catalog.api.record.AbstractVersionedRecordService;
import com.mobi.catalog.api.record.RecordService;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
        immediate = true,
        service = { RecordService.class, SimpleVersionedRecordService.class }
)
public class SimpleVersionedRecordService extends AbstractVersionedRecordService<VersionedRecord> {

    @Reference
    VersionedRecordFactory versionedRecordFactory;

    @Activate
    void start() {
        this.recordFactory = versionedRecordFactory;
    }

    @Override
    public Class<VersionedRecord> getType() {
        return VersionedRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return VersionedRecord.TYPE;
    }
}
