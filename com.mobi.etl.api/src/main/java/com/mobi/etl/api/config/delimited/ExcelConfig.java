package com.mobi.etl.api.config.delimited;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.Model;

import java.io.InputStream;

public class ExcelConfig extends DelimitedConfig {

    private ExcelConfig(ExcelConfigBuilder builder) {
        super(builder);
    }

    public static class ExcelConfigBuilder extends Builder<ExcelConfigBuilder> {
        public ExcelConfigBuilder(InputStream data, Model mapping) {
            super(data, mapping);
        }

        public ExcelConfig build() {
            return new ExcelConfig(this);
        }
    }
}
