package org.matonto.catalog.impl;

import org.matonto.catalog.api.Catalog;

import java.time.OffsetDateTime;

class SimpleCatalog implements Catalog {

    private final String title;
    private final String description;
    private final OffsetDateTime issued;
    private final OffsetDateTime modified;
    private final String license;
    private final String rights;

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
    public String getLicense() {
        return license;
    }

    @Override
    public String getRights() {
        return rights;
    }

    public static class Builder {
        private final String title;

        private String description = "";
        private OffsetDateTime issued = OffsetDateTime.now();
        private OffsetDateTime modified = null;
        private String license = "";
        private String rights = "";

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

        public Builder license(String val) {
            this.license = val;
            return this;
        }

        public Builder rights(String val) {
            this.rights = val;
            return this;
        }

        public SimpleCatalog build() {
            if (modified == null) {
                modified = issued;
            } else if (issued.isAfter(modified)) {
                throw new IllegalStateException("Modified time must occur after issued time.");
            }

            return new SimpleCatalog(this);
        }
    }

    private SimpleCatalog(Builder builder) {
        title = builder.title;
        description = builder.description;
        issued = builder.issued;
        modified = builder.modified;
        license = builder.license;
        rights = builder.rights;
    }
}
