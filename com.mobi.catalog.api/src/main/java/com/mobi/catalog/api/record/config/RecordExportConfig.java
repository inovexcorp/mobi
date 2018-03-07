package com.mobi.catalog.api.record.config;

import org.openrdf.rio.RDFFormat;

import java.io.IOException;
import java.io.OutputStream;

public class RecordExportConfig {
    private OutputStream output;
    private RDFFormat format;

    protected RecordExportConfig(Builder builder) {
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

        public RecordExportConfig build() throws IOException {
            return new RecordExportConfig(this);
        }
    }
}
