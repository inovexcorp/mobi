package org.matonto.catalog.impl;

import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class SimplePublishedResource implements PublishedResource {

    protected String title;
    protected String description;
    protected OffsetDateTime issued;
    protected OffsetDateTime modified;
    protected String identifier;
    protected Set<String> keywords;
    protected Set<Distribution> distributions;
    protected Resource resource;
    protected Resource type;

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
    public Resource getType() {
        return type;
    }

    public static class Builder {
        private final String title;
        private final Resource resource;
        private final Resource type;

        private String description = "";
        private OffsetDateTime issued = OffsetDateTime.now();
        private OffsetDateTime modified = null;
        private String identifier = "";
        private Set<String> keywords = new HashSet<>();
        private Set<Distribution> distributions = new HashSet<>();

        /**
         * Builder for SimpleCatalog. Title is required. Issued and Modified Dates default to time
         * of Builder creation. All other parameters are optional and default to empty strings.
         *
         * @param title The Catalog title.
         */
        public Builder(Resource resource, Resource type, String title) {
            this.resource = resource;
            this.type = type;
            this.title = title;
        }

        public Builder description(String val) {
            this.description = val;
            return this;
        }

        public Builder issued(OffsetDateTime val) {
            this.issued = val;
            return this;
        }

        public Builder modified(OffsetDateTime val) {
            this.modified = val;
            return this;
        }

        public Builder identifier(String val) {
            this.identifier = val;
            return this;
        }

        public Builder addKeyword(String val) {
            this.keywords.add(val);
            return this;
        }

        public Builder addDistribution(Distribution val) {
            this.distributions.add(val);
            return this;
        }

        public SimplePublishedResource build() {
            if (modified == null) {
                modified = issued;
            } else if (issued.isAfter(modified)) {
                throw new IllegalStateException("Modified time must occur after issued time.");
            }

            return new SimplePublishedResource(this);
        }
    }

    private SimplePublishedResource(Builder builder) {
        title = builder.title;
        description = builder.description;
        issued = builder.issued;
        modified = builder.modified;
        identifier = builder.identifier;
        keywords = builder.keywords;
        distributions = builder.distributions;
        resource = builder.resource;
        type = builder.type;
    }
}
