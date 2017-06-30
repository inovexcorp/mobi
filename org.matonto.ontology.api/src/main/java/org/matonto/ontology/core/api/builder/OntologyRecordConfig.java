package org.matonto.ontology.core.api.builder;

/*-
 * #%L
 * org.matonto.ontology.api
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
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.rdf.api.IRI;

import java.util.Optional;
import java.util.Set;

public class OntologyRecordConfig extends RecordConfig {
    private IRI ontologyIRI;

    private OntologyRecordConfig(OntologyRecordBuilder builder) {
        super(builder);
        this.ontologyIRI = builder.ontologyIRI;
    }

    public Optional<IRI> getOntologyIRI() {
        return Optional.ofNullable(ontologyIRI);
    }

    public static class OntologyRecordBuilder extends Builder {
        private IRI ontologyIRI;

        /**
         * The constructor for the OntologyRecordBuilder.
         *
         * @param title The title of the OntologyRecord.
         * @param publishers The Set of Users publishing this OntologyRecord.
         */
        public OntologyRecordBuilder(String title, Set<User> publishers) {
            super(title, publishers);
        }

        public OntologyRecordBuilder ontologyIRI(IRI ontologyIRI) {
            this.ontologyIRI = ontologyIRI;
            return this;
        }

        public OntologyRecordConfig build() {
            return new OntologyRecordConfig(this);
        }
    }
}
