package com.mobi.ontology.utils.cache;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import com.mobi.ontology.core.api.Ontology;
import com.mobi.rdf.api.Resource;

import java.util.Optional;
import javax.annotation.Nonnull;
import javax.cache.Cache;

public interface OntologyCache {
    /**
     * Creates a cache key using the provided Record, Branch, and Commit IRI strings. Null values are accepted
     * and used within the key string.
     *
     * @param recordIri The IRI string of a Record
     * @param branchIri The IRI string of a Branch
     * @param commitIri The IRI string of a Commit
     * @return A string to use as a cache key that incorporates all three passed strings, even if they are null
     */
    String generateKey(String recordIri, String branchIri, String commitIri);

    /**
     * Retrieves the ontology cache if it is found.
     *
     * @return An Optional with the ontology cache if found; empty Optional otherwise
     */
    Optional<Cache<String, Ontology>> getOntologyCache();

    /**
     * Removes any cached ontologies that import the provided ontology IRI.
     *
     * @param ontologyIRI The IRI of an imported ontology
     */
    void clearCacheImports(Resource ontologyIRI);

    /**
     * Removes any cached ontologies that relate to Record identified by the provided Resources.
     *
     * @param recordId A Resource identifying a Record
     * @param branchId A Resource identifying a Branch of the Record
     */
    void clearCache(@Nonnull Resource recordId, Resource branchId);

    /**
     * Remove the cached ontology which matches the key generated using the provided Record, Branch, and Commit IRI
     * strings. Null values are accepted and used within the key string.
     *
     * @param recordIdStr The IRI string of a Record
     * @param branchIdStr The IRI string of a Branch
     * @param commitIdStr The IRI string of a Commit
     */
    void removeFromCache(String recordIdStr, String branchIdStr, String commitIdStr);
}
