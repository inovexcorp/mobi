package org.matonto.catalog.api;

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
