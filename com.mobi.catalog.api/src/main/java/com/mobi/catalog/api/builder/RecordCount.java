package com.mobi.catalog.api.builder;

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

import org.eclipse.rdf4j.model.Resource;

import java.util.Objects;

public class RecordCount {
    private final Resource record;
    private final String title;
    private final Integer count;

    public RecordCount(Resource record, String title, Integer count) {
        this.record = record;
        this.title = title;
        this.count = count;
    }

    public Resource getRecord() {
        return record;
    }

    public String getTitle() {
        return title;
    }

    public Integer getCount() {
        return count;
    }

    @Override
    public String toString() {
        return "{\"record\": \"" + record + "\", \"title\": \"" + title + "\", \"count\": " + count + "}";
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }
        RecordCount otherRecordCount = (RecordCount) obj;
        return Objects.equals(record, otherRecordCount.record)
                && title.equals(otherRecordCount.title)
                && Objects.equals(count, otherRecordCount.count);
    }
}

