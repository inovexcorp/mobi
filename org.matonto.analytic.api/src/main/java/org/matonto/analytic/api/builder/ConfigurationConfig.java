package org.matonto.analytic.api.builder;

/*-
 * #%L
 * org.matonto.analytic.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

public class ConfigurationConfig {

    private String title;

    private ConfigurationConfig(Builder builder) {
        this.title = builder.title;
    }

    public String getTitle() {
        return title;
    }

    public static class Builder {
        private String title;

        /**
         * The constructor for the ConfigurationBuilder.
         *
         * @param title The title of the Configuration.
         */
        public Builder(String title) {
            this.title = title;
        }

        public ConfigurationConfig build() {
            return new ConfigurationConfig(this);
        }
    }
}
