package org.matonto.catalog.impl;

import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.Ontology;
import org.matonto.rdf.api.Resource;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Set;

public class SimpleOntology implements Ontology {

    @Override
    public String getTitle() {
        return null;
    }

    @Override
    public String getDescription() {
        return null;
    }

    @Override
    public OffsetDateTime getIssued() {
        return null;
    }

    @Override
    public OffsetDateTime getModified() {
        return null;
    }

    @Override
    public String getIdentifier() {
        return null;
    }

    @Override
    public Set<String> getKeywords() {
        return null;
    }

    @Override
    public Set<Distribution> getDistributions() {
        return null;
    }

    @Override
    public Resource getResource() {
        return null;
    }

    @Override
    public Resource getType() {
        return null;
    }

    public static class Builder {
        private final String title;

        private String description = "";
        private OffsetDateTime issued = OffsetDateTime.now();
        private OffsetDateTime modified = null;
        private String identifier = "";
        private Set<String> keywords = Collections.emptySet();

        /**
         * Builder for SimpleCatalog. Title is required. Issued and Modified Dates default to time
         * of Builder creation. All other parameters are optional and default to empty strings.
         *
         * @param title The Catalog title.
         */
        public Builder(String title) {
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

        public SimpleOntology build() {
            if (modified == null) {
                modified = issued;
            } else if (issued.isAfter(modified)) {
                throw new IllegalStateException("Modified time must occur after issued time.");
            }

            return new SimpleOntology(this);
        }
    }

    private SimpleOntology(Builder builder) {
    }
}
