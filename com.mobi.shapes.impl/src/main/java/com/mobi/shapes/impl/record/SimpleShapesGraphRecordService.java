package com.mobi.shapes.impl.record;

/*-
 * #%L
 * com.mobi.shapes.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecordFactory;
import com.mobi.shapes.api.record.AbstractShapesGraphRecordService;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
        immediate = true,
        service = { RecordService.class, SimpleShapesGraphRecordService.class }
)
public class SimpleShapesGraphRecordService extends AbstractShapesGraphRecordService<ShapesGraphRecord> {

    @Reference
    public ShapesGraphRecordFactory shapesGraphRecordFactory;

    @Activate
    public void activate() {
        this.recordFactory = shapesGraphRecordFactory;
    }

    @Override
    public Class<ShapesGraphRecord> getType() {
        return ShapesGraphRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return ShapesGraphRecord.TYPE;
    }
}
