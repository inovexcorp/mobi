package org.matonto.catalog.impl;

import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.catalog.api.PublishedResourceBuilder;
import org.matonto.rdf.api.Resource;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

public abstract class AbstractPublishedResourceBuilder<T extends PublishedResourceBuilder, U extends PublishedResource>
        implements PublishedResourceBuilder<T, U> {

    protected String title;
    protected Resource resource;

    protected String description = "";
    protected OffsetDateTime issued = OffsetDateTime.now();
    protected OffsetDateTime modified = null;
    protected String identifier = "";
    protected Set<String> keywords = new HashSet<>();
    protected Set<Distribution> distributions = new HashSet<>();
    protected Set<Resource> types = new HashSet<>();

    @Override
    public T description(String val) {
        this.description = val;
        return getThis();
    }

    public T issued(OffsetDateTime val) {
        this.issued = val;
        return getThis();
    }

    public T modified(OffsetDateTime val) {
        this.modified = val;
        return getThis();
    }

    public T identifier(String val) {
        this.identifier = val;
        return getThis();
    }

    public T addKeyword(String val) {
        this.keywords.add(val);
        return getThis();
    }

    public T addDistribution(Distribution val) {
        this.distributions.add(val);
        return getThis();
    }

    public T addType(Resource val) {
        this.types.add(val);
        return getThis();
    }

    protected abstract T getThis();

    protected void setModified() {
        if (modified == null) {
            modified = issued;
        } else if (issued.isAfter(modified)) {
            throw new IllegalStateException("Modified time must occur after issued time.");
        }
    }
}
