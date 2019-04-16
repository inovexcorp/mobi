package com.mobi.jaas.api.engines;

/*-
 * #%L
 * com.mobi.jaas
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

import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;

import java.util.Optional;
import java.util.Set;

public interface Engine {
    /**
     * Attempts to retrieve the {@link Role} with the provided name. Returns an {@link Optional} with the {@link Role}
     * if it exists for the {@link Engine}.
     *
     * @param roleName the name of the {@link Role} to retrieve
     * @return an {@link Optional} that contains the {@link Role} if present; {@link Optional#empty()} otherwise
     */
    Optional<Role> getRole(String roleName);

    /**
     * Returns the {@link Set} of all {@link User Users} accessible by the {@link Engine Engine's} data source.
     *
     * @return a {@link Set} of {@link User Users} accessible by the {@link Engine}
     */
    Set<User> getUsers();

    /**
     * Creates a {@link User} using the provided configuration object with a username, password, roles, first name,
     * last name, and email address.
     *
     * @param userConfig a {@link UserConfig} for the new {@link User}
     * @return a {@link User} with properties set by the passed configuration object
     */
    User createUser(UserConfig userConfig);

    /**
     * Adds the provided {@link User} to the {@link Engine Engine's} data source.
     *
     * @param user the {@link User} to store
     * @throws IllegalArgumentException If the provided {@link User} does not have a username or the IRI of the
     *      {@link User} already exists in the data source.
     */
    void storeUser(User user);

    /**
     * Attempts to retrieve the {@link User} with the provided username from the {@link Engine Engine's} data source.
     * Returns an {@link Optional} with the {@link User} if it was found.
     *
     * @param username the username of the {@link User} to retrieve
     * @return an {@link Optional} that contains the {@link User} if present; {@link Optional#empty()} otherwise
     */
    Optional<User> retrieveUser(String username);

    /**
     * Removes the {@link User} with the provided username from the {@link Engine Engine's} data source.
     *
     * @param username the username of the {@link User} to delete
     * @throws IllegalArgumentException If a {@link User} with the provided username does not exist in the data source.
     */
    void deleteUser(String username);

    /**
     * Replaces the matching {@link User} in the {@link Engine Engine's} data source with the provided new {@link User}.
     *
     * @param newUser the new {@link User} object to replace the existing one
     * @throws IllegalArgumentException If the IRI of the provided {@link User} does not already exist in the data
     *      source.
     */
    void updateUser(User newUser);

    /**
     * Returns a boolean indicating whether a {@link User} with the passed username exists in the
     * {@link Engine Engine's} data source.
     *
     * @param username the username to look for in the {@link Engine Engine's} data source
     * @return true if a {@link User} exists with the passed username; false otherwise
     */
    boolean userExists(String username);

    /**
     * Returns the {@link Set} of all {@link Group Groups} accessible by the {@link Engine Engine's} data source.
     *
     * @return a {@link Set} of {@link Group Groups} accessible by the {@link Engine}
     */
    Set<Group> getGroups();

    /**
     * Creates a {@link Group} using the passed configuration object with a title, description, roles, and list of
     * member usernames.
     *
     * @param groupConfig a {@link GroupConfig} for the new {@link Group}
     * @return a {@link Group} with properties set by the passed configuration object
     */
    Group createGroup(GroupConfig groupConfig);

    /**
     * Adds the passed {@link Group} to the {@link Engine Engine's} data source.
     *
     * @param group the {@link Group} to store
     * @throws IllegalArgumentException If the provided {@link Group} does not have a title or the IRI of the
      *      {@link Group} already exists in the data source.
     */
    void storeGroup(Group group);

    /**
     * Attempts to retrieve the {@link Group} with the passed name from the {@link Engine Engine's} data source.
     *
     * @param groupTitle the title of the {@link Group} to retrieve
     * @return an {@link Optional} that contains the {@link Group} if present; {@link Optional#empty()} otherwise
     */
    Optional<Group> retrieveGroup(String groupTitle);

    /**
     * Removes the {@link Group} with the passed name from the {@link Engine Engine's} data source.
     *
     * @param groupTitle the title of the {@link Group} to delete
     * @throws IllegalArgumentException If a {@link Group} with the provided title does not exists in the data source.
     */
    void deleteGroup(String groupTitle);

    /**
     * Replaces the matching {@link Group} in the {@link Engine Engine's} data source with the provided new
     * {@link Group}.
     *
     * @param newGroup the new {@link Group} object to replace the existing one
     * @throws IllegalArgumentException If the IRI of the provided {@link Group} does not already exist in the data
     *      source.
     */
    void updateGroup(Group newGroup);

    /**
     * Returns a boolean indicating whether a {@link Group} with the passed name exists in the {@link Engine Engine's}
     * data source.
     *
     * @param groupTitle the title to look for in the {@link Engine Engine's} data source
     * @return true if a {@link Group} exists with the passed name; false otherwise
     */
    boolean groupExists(String groupTitle);

    /**
     * Retrieves the {@link Set} of all {@link Role Roles} that the {@link User} with the passed username embodies.
     * This {@link Set} should contain all {@link Role Roles} from all the User's {@link Group Groups} as well.
     *
     * @param username the username of the {@link User} to collect the roles for
     * @return the {@link Set} of {@link Role Roles} that the {@link User} embodies
     * @throws IllegalArgumentException If a {@link User} with the provided username does not exist in the data source.
     */
    Set<Role> getUserRoles(String username);

    /**
     * Returns a boolean indicating whether the passed password matches the saved password for the {@link User} with the
     * passed username.
     *
     * @param username the username for the {@link User} to test the password of
     * @param password the password to test
     * @return true if the passwords match; false otherwise
     * @throws IllegalArgumentException If a {@link User} with the provided username does not exist in the data source.
     * @throws IllegalStateException If an error occurs retrieving required information about the {@link User}.
     */
    boolean checkPassword(String username, String password);

    /**
     * Returns the name of the {@link Engine}.
     *
     * @return The name of the {@link Engine}.
     */
    String getEngineName();
}
