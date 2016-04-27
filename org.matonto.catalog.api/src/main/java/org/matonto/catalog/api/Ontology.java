package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

public interface Ontology extends PublishedResource {

    @Override
    Resource getType();
}
