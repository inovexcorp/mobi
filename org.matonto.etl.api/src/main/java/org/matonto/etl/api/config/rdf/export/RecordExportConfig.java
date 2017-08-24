package org.matonto.etl.api.config.rdf.export;

/*-
 * #%L
 * org.matonto.etl.api
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

import org.openrdf.rio.RDFFormat;

import java.io.IOException;
import java.io.OutputStream;

public class RecordExportConfig extends BaseExportConfig {

    protected RecordExportConfig(Builder builder) {
        super(builder);
    }

    public static class Builder extends BaseExportConfig.Builder {

        public Builder(OutputStream output, RDFFormat format) {
            super(output, format);
        }

        // TODO: Allow passing in list of records

        public RecordExportConfig build() throws IOException {
            return new RecordExportConfig(this);
        }
    }
}
