package com.mobi.jaas.api.engines;

/*-
 * #%L
 * com.mobi.jaas.api
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

import java.util.Set;

public class GroupConfig {
    private String title;
    private String description = "";
    private Set<String> members;
    private Set<String> roles;

    private GroupConfig(Builder builder) {
        title = builder.title;
        description = builder.description;
        members = builder.members;
        roles = builder.roles;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Set<String> getMembers() {
        return members;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public static class Builder {
        private final String title;
        private String description = "";
        private Set<String> members;
        private Set<String> roles;

        /**
         * Creates a builder object for a GroupConfig with the passed title.
         *
         * @param title the required title string for a Group
         */
        public Builder(String title) {
            this.title = title;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder members(Set<String> members) {
            this.members = members;
            return this;
        }

        public Builder roles(Set<String> roles) {
            this.roles = roles;
            return this;
        }

        public GroupConfig build() {
            return new GroupConfig(this);
        }
    }
}
