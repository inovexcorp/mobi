package com.mobi.ontology.utils.imports;

/*-
 * #%L
 * com.mobi.ontology.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import java.util.Optional;

public interface ImportsResolver {

    /**
     * Attempts to retrieve an ontology from the web given an IRI.
     *
     * @param ontologyIRI The IRI of the Ontology to resolve from the web
     * @return An Optional of the File representing the ontology of the provided IRI
     */
    Optional<File> retrieveOntologyFromWebFile(Resource ontologyIRI);

    /**
     * Attempts to retrieve an ontology file from the local catalog given an ontology IRI.
     *
     * @param ontologyIRI The IRI of the Ontology to resolve from the local catalog
     * @return An Optional of the File representing the ontology of the provided IRI
     */
    Optional<File> retrieveOntologyLocalFile(Resource ontologyIRI);

    /**
     * Attempts to retrieve an ontology file from the local catalog given a Record IRI.
     *
     * @param recordIRI The IRI of the VersionedRDFRecord to generate the File from
     * @return An Optional of the File representing the ontology tracked by the provided Record IRI
     */
    Optional<File> retrieveOntologyLocalFileFromRecordIRI(Resource recordIRI);

    /**
     * Retrieves an ontology file from a given Commit IRI. Assumes the Commit is present.
     *
     * @param commitIRI The IRI of the Commit to generate the File from
     * @return A File representing the ontology tracked by the provided Record IRI
     * @throws IllegalArgumentException if the Commit does not exist.
     */
    File retrieveOntologyLocalFileFromCommitIRI(Resource commitIRI);

    /**
     * Attempts to find a VersionedRDFRecord that tracks the provided ontology IRI and if found, returns the Record IRI.
     *
     * @param ontologyIRI The IRI of the Ontology to search the local catalog for
     * @return An Optional of the Record IRI that tracks the provided Ontology IRI
     */
    Optional<Resource> getRecordIRIFromOntologyIRI(Resource ontologyIRI);
}
