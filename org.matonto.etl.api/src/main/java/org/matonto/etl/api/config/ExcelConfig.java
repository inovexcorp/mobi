package org.matonto.etl.api.config;

/*-
 * #%L
 * org.matonto.etl.api
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

import org.matonto.rdf.api.Model;

import java.io.InputStream;
import java.util.Optional;

public class ExcelConfig {
    private InputStream data;
    private Model mapping;
    private boolean containsHeaders = true;
    private Long limit;
    private long offset = 0;

    private ExcelConfig(Builder builder) {
        data = builder.data;
        mapping = builder.mapping;
        containsHeaders = builder.containsHeaders;
        limit = builder.limit;
        offset = builder.offset;
    }

    public InputStream getData() {
        return data;
    }

    public Model getMapping() {
        return mapping;
    }

    public boolean getContainsHeaders() {
        return containsHeaders;
    }

    public Optional<Long> getLimit() {
        return Optional.ofNullable(limit);
    }

    public long getOffset() {
        return offset;
    }

    public static class Builder {
        private final InputStream data;
        private final Model mapping;
        private boolean containsHeaders = true;
        private Long limit;
        private long offset = 0;

        public Builder(InputStream data, Model mapping) {
            this.data = data;
            this.mapping = mapping;
        }

        public Builder containsHeaders(boolean containsHeaders) {
            this.containsHeaders = containsHeaders;
            return this;
        }

        public Builder limit(Long limit) {
            this.limit = limit;
            return this;
        }

        public Builder offset(long offset) {
            this.offset = offset;
            return this;
        }

        public ExcelConfig build() {
            return new ExcelConfig(this);
        }
    }
}
