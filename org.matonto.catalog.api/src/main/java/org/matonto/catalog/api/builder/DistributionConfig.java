package org.matonto.catalog.api.builder;

/*-
 * #%L
 * org.matonto.catalog.api
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

import org.matonto.rdf.api.Resource;

public class DistributionConfig {
    private String title;
    private String description;
    private String format;
    private Resource accessURL;
    private Resource downloadURL;

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

    public Resource getAccessURL() {
        return accessURL;
    }

    public Resource getDownloadURL() {
        return downloadURL;
    }

    public static class Builder {
        private String title;
        private String description;
        private String format;
        private Resource accessURL;
        private Resource downloadURL;

        /**
         * The constructor for the builder.
         *
         * @param title The title String.
         */
        public Builder(String title) {
            this.title = title;
        }

        public DistributionConfig.Builder description(String description) {
            this.description = description;
            return this;
        }

        public DistributionConfig.Builder format(String format) {
            this.format = format;
            return this;
        }

        public DistributionConfig.Builder accessURL(Resource accessURL) {
            this.accessURL = accessURL;
            return this;
        }

        public DistributionConfig.Builder downloadURL(Resource downloadURL) {
            this.downloadURL = downloadURL;
            return this;
        }

        public DistributionConfig build() {
            return new DistributionConfig(this);
        }
    }
}
