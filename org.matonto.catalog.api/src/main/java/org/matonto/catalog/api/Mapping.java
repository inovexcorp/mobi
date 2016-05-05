package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

public interface Mapping extends PublishedResource {

    @Override
    Resource getType();
}
