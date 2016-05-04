package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

public interface CatalogFactory {

    /**
     * Creates an OntologyBuilder for building an Ontology Catalog resource.
     *
     * @param resource The Resource identifying the Catalog resource.
     * @param title The title of the Catalog resource.
     * @return The OntologyBuilder for building an Ontology Catalog resource.
     */
    OntologyBuilder createOntologyBuilder(Resource resource, String title);
}
