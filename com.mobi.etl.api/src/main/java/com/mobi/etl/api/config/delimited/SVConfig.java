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

public class SVConfig extends DelimitedConfig {
    private char separator = ',';

    private SVConfig(SVConfigBuilder builder) {
        super(builder);
        separator = builder.separator;
    }

    public char getSeparator() {
        return separator;
    }

    public static class SVConfigBuilder extends Builder<SVConfigBuilder> {
        private char separator = ',';

        public SVConfigBuilder(InputStream data, Model mapping) {
            super(data, mapping);
        }

        public SVConfigBuilder separator(char separator) {
            this.separator = separator;
            return this;
        }

        public SVConfig build() {
            return new SVConfig(this);
        }
    }
}
