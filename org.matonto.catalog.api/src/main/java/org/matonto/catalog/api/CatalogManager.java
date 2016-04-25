package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

import java.util.Optional;
import java.util.Set;

public interface CatalogManager {

//    <T extends PublishedResource> Set<T> findResource(String searchTerm);

    /**
     * Searches the Catalog for resources that match a given String. Allows paging with the limit and offset
     * parameters.
     *
     * @param searchTerm The String providing the search criteria.
     * @param limit The limit to the number of resources to find.
     * @param offset The start index of search results to return.
     * @return The Set of PublishedResources matching the search criteria.
     */
    Set<PublishedResource> findResource(String searchTerm, int limit, int offset);

    /**
     * Retrieves the PublishedResource with the given Resource identifier.
     *
     * @param resource The Resource identifier of the PublishedResource.
     * @return The Optional of the PublishedResource with the given Resource identifier or Optional.empty() if
     *      the PublishedResource does not exist.
     */
    Optional<PublishedResource> getResource(Resource resource);

//    <T extends PublishedResource> Optional<T> getResource(Resource resource, Class<T> clazz);

//    <T extends PublishedResource> T removeResource(Resource resource);

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
