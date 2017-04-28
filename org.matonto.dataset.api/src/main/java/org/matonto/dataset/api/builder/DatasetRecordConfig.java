package org.matonto.dataset.api.builder;

/*-
 * #%L
 * org.matonto.dataset.api
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

import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordIdentifier;
import org.matonto.jaas.api.ontologies.usermanagement.User;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public class DatasetRecordConfig extends RecordConfig {

    private String dataset;
    private String repositoryId;
    private Set<VersionedRDFRecordIdentifier> ontologies;

    private DatasetRecordConfig(DatasetRecordBuilder builder) {
        super(builder);
        this.dataset = builder.dataset;
        this.repositoryId = builder.repositoryId;
        this.ontologies = builder.ontologies;
    }

    public String getDataset() {
        return dataset;
    }

    public String getRepositoryId() {
        return repositoryId;
    }

    public Set<VersionedRDFRecordIdentifier> getOntologies() {
        return ontologies;
    }

    public static class DatasetRecordBuilder extends Builder {
        private String dataset;
        private String repositoryId;
        private Set<VersionedRDFRecordIdentifier> ontologies = new HashSet<>();

        private static final String DEFAULT_DS_NAMESPACE = "http://matonto.org/dataset/";

        /**
         * The constructor for the DatasetRecordBuilder.
         *
         * @param title The title of the dataset record.
         * @param publishers The Set users publishing this dataset record.
         */
        public DatasetRecordBuilder(String title, Set<User> publishers, String repositoryId) {
            super(title, publishers);
            this.repositoryId = repositoryId;
        }

        public DatasetRecordBuilder dataset(String dataset) {
            this.dataset = dataset;
            return this;
        }

        public DatasetRecordBuilder ontology(VersionedRDFRecordIdentifier identifier) {
            ontologies.add(identifier);
            return this;
        }

        public DatasetRecordConfig build() {
            if (this.dataset == null) {
                this.dataset = DEFAULT_DS_NAMESPACE + UUID.randomUUID();
            }

            return new DatasetRecordConfig(this);
        }
    }
}
