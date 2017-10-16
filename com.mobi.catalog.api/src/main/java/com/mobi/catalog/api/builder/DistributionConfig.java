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

import com.mobi.rdf.api.IRI;

public class DistributionConfig {
    private String title;
    private String description;
    private String format;
    private IRI accessURL;
    private IRI downloadURL;

    private DistributionConfig(DistributionConfig.Builder builder) {
        title = builder.title;
        description = builder.description;
        format = builder.format;
        accessURL = builder.accessURL;
        downloadURL = builder.downloadURL;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getFormat() {
        return format;
    }

    public IRI getAccessURL() {
        return accessURL;
    }

    public IRI getDownloadURL() {
        return downloadURL;
    }

    public static class Builder {
        private String title;
        private String description;
        private String format;
        private IRI accessURL;
        private IRI downloadURL;

        /**
         * The constructor for the builder.
         *
         * @param title The title String.
         */
        public Builder(String title) {
            this.title = title;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder format(String format) {
            this.format = format;
            return this;
        }

        public Builder accessURL(IRI accessURL) {
            this.accessURL = accessURL;
            return this;
        }

        public Builder downloadURL(IRI downloadURL) {
            this.downloadURL = downloadURL;
            return this;
        }

        public DistributionConfig build() {
            return new DistributionConfig(this);
        }
    }
}
