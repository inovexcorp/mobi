package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

public interface CatalogFactory {

    OntologyBuilder createOntologyBuilder(Resource resource, String title);
}
