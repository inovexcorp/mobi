package com.mobi.ontology.core.api;

/*-
 * #%L
 * com.mobi.ontology.api
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

import org.eclipse.rdf4j.model.Resource;

import java.io.File;

/**
 * Interface was added as a way to prevent circular references between the OntologyCache/OntologyRepositoryCache
 * and the OntologyManager. Interface will be removed when OntologyCache structure is revamped.
 */
public interface OntologyCreationService {
    /**
     * Creates an Ontology using the provided Commit.
     *
     * @param recordId The Commit identifying the version of the Ontology that you want to create.
     * @param commitId The Commit identifying the version of the Ontology that you want to create.
     * @return An Ontology built at the time identified by the Commit.
     */
    Ontology createOntologyFromCommit(Resource recordId, Resource commitId);

    /**
     * Creates an Ontology using the provided File. Using the recordId and commitId to generate the cache key.
     *
     * @param ontologyFile The {@link File} containing valid RDF.
     * @param recordId The {@link Resource} of the Record.
     * @param commitId The {@link Resource} of the Commit.
     * @return An Ontology loaded into the cache using the File.
     */
    Ontology createOntology(File ontologyFile, Resource recordId, Resource commitId);

    /**
     * Creates an Ontology using the recordId and commitId to generate the key to retrieve the ontology from the cache.
     *
     * @param recordId The {@link Resource} of the Record.
     * @param commitId The {@link Resource} of the Commit.
     * @return An Ontology that was previously loaded into the cache.
     */
    Ontology createOntology(Resource recordId, Resource commitId);
}
