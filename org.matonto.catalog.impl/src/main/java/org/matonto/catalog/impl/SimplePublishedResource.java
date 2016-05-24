package org.matonto.catalog.impl;

public class SimplePublishedResource extends AbstractPublishedResource {

    SimplePublishedResource(SimplePublishedResourceBuilder builder) {
        title = builder.title;
        description = builder.description;
        issued = builder.issued;
        modified = builder.modified;
        identifier = builder.identifier;
        keywords = builder.keywords;
        distributions = builder.distributions;
        resource = builder.resource;
        types = builder.types;
    }
}
