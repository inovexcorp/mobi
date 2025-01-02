package com.mobi.etl.api.config.rdf.export;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

public class BaseExportConfig {
    private OutputStream output;
    private RDFFormat format;

    protected BaseExportConfig(Builder builder) {
        this.output = builder.output;
        this.format = builder.format;
    }

    public OutputStream getOutput() {
        return output;
    }

    public RDFFormat getFormat() {
        return format;
    }

    public static class Builder {
        private OutputStream output;
        private RDFFormat format;

        /**
         * Creates a new Builder for a BaseExportConfig.
         *
         * @param output The OutputStream for the exported data.
         * @param format The RDFFormat for the exported data.
         */
        public Builder(OutputStream output, RDFFormat format) {
            this.output = output;
            this.format = format;
        }

        public BaseExportConfig build() throws IOException {
            return new BaseExportConfig(this);
        }
    }
}
