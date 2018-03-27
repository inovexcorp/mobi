package com.mobi.catalog.api.record.config;

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

import com.mobi.persistence.utils.BatchExporter;
import com.mobi.persistence.utils.api.SesameTransformer;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;

import java.io.IOException;
import java.io.OutputStream;

public class RecordExportConfig {
    protected BatchExporter batchExporter;

    protected RecordExportConfig(Builder builder) {
        this.batchExporter = builder.batchExporter;
    }

    public BatchExporter getBatchExporter() {
        return batchExporter;
    }

    public static class Builder {
        protected BatchExporter batchExporter;
        protected OutputStream outputStream ;
        protected RDFFormat format;
        protected SesameTransformer transformer;

        /**
         * Creates a new Builder for RecordExportConfig with the provided BatchExporter
         *
         * @param batchExporter the {@link BatchExporter} to handle writing
         */
        public Builder(BatchExporter batchExporter) {
            this.batchExporter = batchExporter;
        }

        /**
         * Creates a new Builder for RecordExportConfig with the provided fields
         *
         * @param os the {@link OutputStream} to write to
         * @param format the {@link RDFFormat} of the output
         * @param transformer the {@link SesameTransformer} to be used in BatchExporter
         */
        public Builder(OutputStream os, RDFFormat format, SesameTransformer transformer) {
            this.outputStream = os;
            this.format = format;
            this. transformer = transformer;
        }

        public RecordExportConfig build() throws IOException {
            if (this.batchExporter == null) {
                this.batchExporter = new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(format, outputStream)));
            }
            return new RecordExportConfig(this);
        }
    }
}
