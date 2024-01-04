package com.mobi.catalog.impl.record;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import com.mobi.catalog.api.record.AbstractUnversionedRecordService;
import com.mobi.catalog.api.record.RecordService;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
        immediate = true,
        service = { RecordService.class, SimpleUnversionedRecordService.class }
)
public class SimpleUnversionedRecordService extends AbstractUnversionedRecordService<UnversionedRecord> {

    @Reference
    UnversionedRecordFactory unversionedRecordFactory;

    @Activate
    void start() {
        this.recordFactory = this.unversionedRecordFactory;
    }

    @Override
    public Class<UnversionedRecord> getType() {
        return UnversionedRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return UnversionedRecord.TYPE;
    }
}
