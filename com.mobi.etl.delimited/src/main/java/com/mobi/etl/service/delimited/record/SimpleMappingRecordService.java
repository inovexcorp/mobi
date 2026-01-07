package com.mobi.etl.service.delimited.record;

/*-
 * #%L
 * com.mobi.etl.delimited
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

import com.mobi.catalog.api.record.RecordService;
import com.mobi.etl.api.delimited.record.AbstractMappingRecordService;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.etl.api.ontologies.delimited.MappingRecordFactory;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
        immediate = true,
        service = { RecordService.class, SimpleMappingRecordService.class }
)
public class SimpleMappingRecordService extends AbstractMappingRecordService<MappingRecord> {

    @Reference
    MappingRecordFactory mappingRecordFactory;

    @Activate
    public void activate() {
        this.recordFactory = mappingRecordFactory;
        checkForMissingPolicies();
    }

    @Override
    public Class<MappingRecord> getType() {
        return MappingRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return MappingRecord.TYPE;
    }
}
