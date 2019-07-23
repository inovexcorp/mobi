package com.mobi.catalog.api.builder;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.jaas.api.ontologies.usermanagement.User;

import java.util.Set;

public class RecordConfig {
    private String title;
    private String description;
    private String markdown;
    private String identifier;
    private Set<String> keywords;
    private Set<User> publishers;

    protected RecordConfig(Builder builder) {
        title = builder.title;
        description = builder.description;
        markdown = builder.markdown;
        identifier = builder.identifier;
        keywords = builder.keywords;
        publishers = builder.publishers;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getMarkdown() {
        return markdown;
    }
    public String getIdentifier() {
        return identifier;
    }

    public Set<String> getKeywords() {
        return keywords;
    }

    public Set<User> getPublishers() {
        return publishers;
    }

    public static class Builder {
        private String title;
        private String description;
        private String markdown;
        private String identifier;
        private Set<String> keywords;
        private Set<User> publishers;

        /**
         * The constructor for the builder.
         *
         * @param title The title String.
         * @param publishers The Set of publisher Users.
         */
        public Builder(String title, Set<User> publishers) {
            this.title = title;
            this.publishers = publishers;
        }

        public Builder identifier(String identifier) {
            this.identifier = identifier;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder markdown(String markdown) {
            this.markdown = markdown;
            return this;
        }

        public Builder keywords(Set<String> keywords) {
            this.keywords = keywords;
            return this;
        }

        public RecordConfig build() {
            return new RecordConfig(this);
        }
    }
}
