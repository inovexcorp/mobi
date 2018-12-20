package com.mobi.etl.api.config.rdf.export;

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

import org.eclipse.rdf4j.rio.RDFFormat;

import java.io.IOException;
import java.io.OutputStream;
import java.util.HashSet;
import java.util.Set;

public class RecordExportConfig extends BaseExportConfig {
    private Set<String> records;

    protected RecordExportConfig(Builder builder) {
        super(builder);
        this.records = builder.records;
    }

    public Set<String> getRecords() {
        return records;
    }

    public static class Builder extends BaseExportConfig.Builder {
        private Set<String> records;

        public Builder(OutputStream output, RDFFormat format) {
            super(output, format);
        }

        /**
         * The set of catalog records to export.
         *
         * @param records The set of catalog records to export
         * @return The Builder
         * @throws IllegalArgumentException if the set is empty
         */
        public Builder records(Set<String> records) {
            if (records.size() <= 0) throw new IllegalArgumentException("Records list cannot be empty.");
            this.records = new HashSet<>(records);
            return this;
        }

        public RecordExportConfig build() throws IOException {
            return new RecordExportConfig(this);
        }
    }
}
