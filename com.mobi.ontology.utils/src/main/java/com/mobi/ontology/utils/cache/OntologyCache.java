package com.mobi.ontology.utils.cache;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import com.mobi.ontology.core.api.Ontology;
import org.eclipse.rdf4j.model.Resource;

import javax.annotation.Nonnull;
import javax.cache.Cache;

public interface OntologyCache extends Cache<String, Ontology> {
    /**
     * Creates a cache key using the provided Record and Commit IRI strings. Null values are accepted and used within
     * the key string.
     *
     * @param recordIri The IRI string of a Record
     * @param commitIri The IRI string of a Commit
     * @return A string to use as a cache key that incorporates all three passed strings, even if they are null
     */
    String generateKey(String recordIri, String commitIri);

    /**
     * Removes any cached ontologies that import the provided ontology IRI.
     *
     * @param ontologyIRI The IRI of an imported ontology
     */
    void clearCacheImports(Resource ontologyIRI);

    /**
     * Removes any cached ontologies that relate to Record identified by the provided Resource.
     *
     * @param recordId A Resource identifying a Record
     */
    void clearCache(@Nonnull Resource recordId);

    /**
     * Remove the cached ontology which matches the key generated using the provided Record and Commit IRI strings.
     * Null values are accepted and used within the key string.
     *
     * @param recordIdStr The IRI string of a Record
     * @param commitIdStr The IRI string of a Commit
     */
    void removeFromCache(String recordIdStr, String commitIdStr);
}
