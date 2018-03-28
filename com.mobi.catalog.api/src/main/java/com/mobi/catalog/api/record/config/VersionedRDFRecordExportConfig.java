package com.mobi.catalog.api.record.config;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
import com.mobi.rdf.api.Resource;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class VersionedRDFRecordExportConfig extends RecordExportConfig {

    protected Set<Resource> branches = new HashSet<>();
    protected boolean writeVersionedData;

    public Set<Resource> getBranches() {
        return branches;
    }

    public boolean writeVersionedData() {
        return writeVersionedData;
    }

    protected VersionedRDFRecordExportConfig(VersionedRDFRecordExportConfig.Builder builder) {
        super(builder);
        this.branches = builder.branches;
        this.writeVersionedData = builder.writeVersionedData;
    }

    public static class Builder extends RecordExportConfig.Builder {

        protected Set<Resource> branches = new HashSet<>();
        protected boolean writeVersionedData = true;

        /**
         * Creates a new Builder for VersionedRDFRecordExportConfig with the provided BatchExporter
         *
         * @param batchExporter the {@link BatchExporter} to handle writing
         */
        public Builder(BatchExporter batchExporter) {
            super(batchExporter);
        }

        /**
         * Creates a new Builder for VersionedRDFRecordExportConfig with the provided fields
         *
         * @param os the {@link OutputStream} to write to
         * @param format the {@link RDFFormat} of the output
         * @param transformer the {@link SesameTransformer} to be used in BatchExporter
         */
        public Builder(OutputStream os, RDFFormat format, SesameTransformer transformer) {
            super(os, format, transformer);
        }

        public Builder addBranchResource(Resource branch) {
            branches.add(branch);
            return this;
        }

        public Builder addBranchResources(Collection<Resource> branchesToAdd) {
            branches.addAll(branchesToAdd);
            return this;
        }

        /**
         * Export the Record only. Does not export commit, branches, or tags. If not set, default is
         * to export everything
         *
         * @param writeVersionedData Boolean to export only Record data
         * @return Builder of VersionedRDFRecordExportConfig
         */
        public Builder writeVersionedData(boolean writeVersionedData) {
            this.writeVersionedData = writeVersionedData;
            return this;
        }

        public VersionedRDFRecordExportConfig build() throws IOException {
            if (this.batchExporter == null) {
                this.batchExporter = new BatchExporter(transformer, new BufferedGroupingRDFHandler(Rio.createWriter(format, outputStream)));
            }
            return new VersionedRDFRecordExportConfig(this);
        }
    }
}
