package org.matonto.etl.api.config.rdf;

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

import java.util.Optional;

public class RDFExportConfig {
    private String filePath;
    private RDFFormat format;
    private String subj;
    private String pred;
    private String objIRI;
    private String objLit;

    protected RDFExportConfig(Builder builder) {
        this.filePath = builder.filePath;
        this.format = builder.format;
        this.subj = builder.subj;
        this.pred = builder.pred;
        this.objIRI = builder.objIRI;
        this.objLit = builder.objLit;
    }

    public Optional<String> getFilePath() {
        return Optional.ofNullable(filePath);
    }

    public RDFFormat getFormat() {
        return format;
    }

    public String getSubj() {
        return subj;
    }

    public String getPred() {
        return pred;
    }

    public String getObjIRI() {
        return objIRI;
    }

    public String getObjLit() {
        return objLit;
    }

    public static class Builder {
        private String filePath;
        private RDFFormat format;
        private String subj;
        private String pred;
        private String objIRI;
        private String objLit;

        /**
         * Creates a new Builder for an RDFExportConfig.
         *
         * @param filePath The path to the file with the exported data.
         */
        public Builder(String filePath) {
            this.filePath = filePath;
        }

        /**
         * Sets the RDF format for the export file.
         *
         * @param format The RDFFormat for the file with the exported data.
         * @return The Builder
         */
        public Builder format(RDFFormat format) {
            this.format = format;
            return this;
        }

        /**
         * Sets the subject to restrict all exported triples to.
         *
         * @param subj A subject string
         * @return The Builder
         */
        public Builder subj(String subj) {
            this.subj = subj;
            return this;
        }

        /**
         * Sets the subject to restrict all exported triples to.
         *
         * @param pred A predicate string
         * @return The Builder
         */
        public Builder pred(String pred) {
            this.pred = pred;
            return this;
        }

        /**
         * An object IRI to restrict all exported triples. Takes precedence over objLit.
         *
         * @param objIRI An object IRI string
         * @return The Builder
         */
        public Builder objIRI(String objIRI) {
            this.objIRI = objIRI;
            return this;
        }

        /**
         * Sets the object literal to restrict all exported triples. Will only be used if objIRI is not passed.
         *
         * @param objLit An object literal string
         * @return The Builder
         */
        public Builder objLit(String objLit) {
            this.objLit = objLit;
            return this;
        }

        public RDFExportConfig build() {
            return new RDFExportConfig(this);
        }
    }
}
