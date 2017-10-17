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

public class UserConfig {
    private String username;
    private String password;
    private Set<String> roles;
    private String email = "";
    private String firstName = "";
    private String lastName = "";

    private UserConfig(Builder builder) {
        username = builder.username;
        password = builder.password;
        roles = builder.roles;
        email = builder.email;
        firstName = builder.firstName;
        lastName = builder.lastName;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public static class Builder {
        private final String username;
        private final String password;
        private final Set<String> roles;
        private String email = "";
        private String firstName = "";
        private String lastName = "";

        /**
         * Creates a builder object for a UserConfig with the passed username, password
         * and set of roles.
         *
         * @param username the required username string for a User
         * @param password the required password string for a User
         * @param roles the required Set of role strings for a User
         */
        public Builder(String username, String password, Set<String> roles) {
            this.username = username;
            this.password = password;
            this.roles = roles;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public UserConfig build() {
            return new UserConfig(this);
        }
    }
}
