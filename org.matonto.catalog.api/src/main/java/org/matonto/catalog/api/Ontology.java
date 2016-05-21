package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

import java.util.Set;

public interface Ontology extends PublishedResource {

    @Override
    Set<Resource> getTypes();
}
