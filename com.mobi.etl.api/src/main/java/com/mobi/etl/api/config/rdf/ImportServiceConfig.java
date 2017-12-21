package com.mobi.etl.api.config.rdf;

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

import com.mobi.rdf.api.Resource;
import org.eclipse.rdf4j.rio.RDFFormat;

public class ImportServiceConfig {
    private String repository;
    private Resource dataset;
    private boolean continueOnError = false;
    private boolean logOutput = false;
    private boolean printOutput = false;
    private RDFFormat format;

    protected ImportServiceConfig(Builder builder) {
        this.repository = builder.repository;
        this.dataset = builder.dataset;
        this.continueOnError = builder.continueOnError;
        this.logOutput = builder.logOutput;
        this.printOutput = builder.printOutput;
        this.format = builder.format;
    }

    public Resource getDataset() {
        return dataset;
    }

    public String getRepository() {
        return repository;
    }

    public boolean getContinueOnError() {
        return continueOnError;
    }

    public boolean getLogOutput() {
        return logOutput;
    }

    public boolean getPrintOutput() {
        return printOutput;
    }

    public RDFFormat getFormat() {
        return format;
    }

    public static class Builder {
        private String repository;
        private Resource dataset;
        private boolean continueOnError = false;
        private boolean logOutput = false;
        private boolean printOutput = false;
        private RDFFormat format;

        public Builder() {}

        /**
         * Sets the target repository of the import.
         *
         * @param repository The id of the target repository
         * @return The Builder
         */
        public Builder repository(String repository) {
            this.repository = repository;
            return this;
        }

        /**
         * Sets the target DatasetRecord of the import.
         *
         * @param dataset The Resource id of the DatasetRecord with the target Dataset.
         * @return The Builder
         */
        public Builder dataset(Resource dataset) {
            this.dataset = dataset;
            return this;
        }

        /**
         * Whether or not the service should continue if it encounters an error.
         *
         * @param cont True if the service should continue on error; false otherwise
         * @return The Builder
         */
        public Builder continueOnError(boolean cont) {
            this.continueOnError = cont;
            return this;
        }

        /**
         * Whether or not the output of the import should be logged.
         *
         * @param logOutput True if the output should be logged; false otherwise
         * @return The Builder
         */
        public Builder logOutput(boolean logOutput) {
            this.logOutput = logOutput;
            return this;
        }

        /**
         * Whether or not the output should be printed to System.out.
         *
         * @param printOutput True if the output should be printed; false otherwise
         * @return The Builder
         */
        public Builder printOutput(boolean printOutput) {
            this.printOutput = printOutput;
            return this;
        }

        /**
         * The RDFFormat of the data to be imported. If importing a file, overrides the format found from the file
         * extension.
         *
         * @param format The RDFFormat of data being imported
         * @return The Builder
         */
        public Builder format(RDFFormat format) {
            this.format = format;
            return this;
        }

        public ImportServiceConfig build() {
            return new ImportServiceConfig(this);
        }
    }

}
