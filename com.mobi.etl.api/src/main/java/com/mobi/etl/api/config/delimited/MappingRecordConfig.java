package com.mobi.etl.api.config.delimited;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.builder.RecordConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;

import java.util.Set;

public class MappingRecordConfig extends RecordConfig {

    private MappingRecordConfig(MappingRecordBuilder builder) {
        super(builder);
    }
    public static class MappingRecordBuilder extends Builder {
        public MappingRecordBuilder(String title, Set<User> publishers) {
            super(title, publishers);
        }

        public MappingRecordConfig build() {
            return new MappingRecordConfig(this);
        }
    }
}
