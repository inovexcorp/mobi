package org.matonto.catalog.api;

/*-
 * #%L
 * org.matonto.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import org.matonto.rdf.api.Resource;

import java.util.Optional;
import java.util.Set;

public interface CatalogManager {

    /**
     * Searches the Catalog for resources that match the provided PaginatedSearchParams.
     *
     * @param searchParams Search parameters.
     * @return The PaginatedSearchResults for a page matching the search criteria.
     */
    PaginatedSearchResults<PublishedResource> findResource(PaginatedSearchParams searchParams);

    /**
     * Retrieves the PublishedResource with the given Resource identifier.
     *
     * @param resource The Resource identifier of the PublishedResource.
     * @return The Optional of the PublishedResource with the given Resource identifier or Optional.empty() if
     *      the PublishedResource does not exist.
     */
    Optional<PublishedResource> getResource(Resource resource);

//    <T extends PublishedResource> Optional<T> getResource(Resource resource, Class<T> clazz);

    /**
     * Removes the PublishedResource with the given Resource identifier.
     *
     * @param resource The Resource identifier of the PublishedResource.
     */
    void removeResource(PublishedResource resource);

    /**
     * Creates an Ontology Resource in the Catalog.
     *
     * @param ontology The Ontology object representing the Ontology to publish.
     */
    void createOntology(Ontology ontology);
}
