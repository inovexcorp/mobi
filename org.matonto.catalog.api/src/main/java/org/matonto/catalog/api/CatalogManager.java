package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

import java.util.Optional;
import java.util.Set;

public interface CatalogManager {

    <T extends PublishedResource> Set<T> findResource(String searchTerm);

    <T extends PublishedResource> Optional<T> getResource(Resource resource);

    <T extends PublishedResource> T removeResource(Resource resource);

    Ontology createOntology(org.matonto.ontology.core.api.Ontology ontology);
}
