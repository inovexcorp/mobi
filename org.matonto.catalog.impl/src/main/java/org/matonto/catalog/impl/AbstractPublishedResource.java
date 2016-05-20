package org.matonto.catalog.impl;

import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.rdf.api.Resource;

import java.time.OffsetDateTime;
import java.util.Set;

public abstract class AbstractPublishedResource implements PublishedResource {

    protected String title;
    protected String description;
    protected OffsetDateTime issued;
    protected OffsetDateTime modified;
    protected String identifier;
    protected Set<String> keywords;
    protected Set<Distribution> distributions;
    protected Resource resource;
    protected Set<Resource> types;

    @Override
    public String getTitle() {
        return title;
    }

    @Override
    public String getDescription() {
        return description;
    }

    @Override
    public OffsetDateTime getIssued() {
        return issued;
    }

    @Override
    public OffsetDateTime getModified() {
        return modified;
    }

    @Override
    public String getIdentifier() {
        return identifier;
    }

    @Override
    public Set<String> getKeywords() {
        return keywords;
    }

    @Override
    public Set<Distribution> getDistributions() {
        return distributions;
    }

    @Override
    public Resource getResource() {
        return resource;
    }

    @Override
    public Set<Resource> getTypes() {
        return types;
    }
}
