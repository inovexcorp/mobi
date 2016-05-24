package org.matonto.catalog.impl;

import org.matonto.catalog.api.PublishedResource;
import org.matonto.catalog.api.PublishedResourceBuilder;
import org.matonto.rdf.api.Resource;

public class SimplePublishedResourceBuilder
        extends AbstractPublishedResourceBuilder<PublishedResourceBuilder, PublishedResource>
        implements PublishedResourceBuilder<PublishedResourceBuilder, PublishedResource> {

    public SimplePublishedResourceBuilder(Resource resource, String title) {
        this.resource = resource;
        this.title = title;
    }

    @Override
    protected PublishedResourceBuilder getThis() {
        return this;
    }

    @Override
    public SimplePublishedResource build() {
        setModified();
        return new SimplePublishedResource(this);
    }
}