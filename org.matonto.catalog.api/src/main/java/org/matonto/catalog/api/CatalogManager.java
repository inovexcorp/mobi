package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

import java.util.Optional;
import java.util.Set;

public interface CatalogManager {

//    <T extends PublishedResource> Set<T> findResource(String searchTerm);

    /**
     * Searches the Catalog for resources that match a given String. Allows paging with the limit and offset
     * parameters. Sorts by modified date descending.
     *
     * @param searchTerm The String providing the search criteria.
     * @param limit The limit to the number of resources to find.
     * @param offset The start index of search results to return.
     * @return The PaginatedSearchResults for a page matching the search criteria.
     */
    PaginatedSearchResults<PublishedResource> findResource(String searchTerm, int limit, int offset);

    /**
     * Searches the Catalog for resources that match a given String. Allows paging with the limit and offset
     * parameters. Allows sorting with the sortBy and ascending parameters. Sorts by modified data descending if
     * an inappropriate resource is passed in.
     *
     * @param searchTerm The String providing the search criteria.
     * @param limit The limit to the number of resources to find.
     * @param offset The start index of search results to return.
     * @param sortBy The resource to sort by.
     * @param ascending Sort ascending if true, else descending.
     * @return The PaginatedSearchResults for a page matching the search criteria.
     */
    PaginatedSearchResults<PublishedResource> findResource(String searchTerm, int limit, int offset, Resource sortBy,
                                                           boolean ascending);

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
