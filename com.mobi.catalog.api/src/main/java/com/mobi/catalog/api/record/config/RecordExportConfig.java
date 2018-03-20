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
    private BatchExporter batchExporter;

    protected RecordExportConfig(Builder builder) {
        this.batchExporter = builder.batchExporter;
    }

    public BatchExporter getBatchExporter() {
        return batchExporter;
    }

    public static class Builder {
        private BatchExporter batchExporter;
        private OutputStream outputStream ;
        private RDFFormat format;
        private SesameTransformer transformer;

        /**
         * Creates a new Builder for RecordExportConfig that will construct a BatchExporter
         * if one is not provided.
         *
         */
        public Builder(BatchExporter batchExporter) {
            this.batchExporter = batchExporter;
        }

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
