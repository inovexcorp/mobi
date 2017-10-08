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
     * Attempts to retrieve the Role with the passed name. Returns an Optional with the Role
     * if it exists for the Engine.
     *
     * @param roleName the name of the Role to retrieve
     * @return an Optional that contains the Role if present; empty otherwise
     */
    Optional<Role> getRole(String roleName);

    /**
     * Returns the Set of all Users accessible by the Engine's data source.
     *
     * @return a Set of Users accessible by the Engine
     */
    Set<User> getUsers();

    /**
     * Creates a User using the passed configuration object with a username, password,
     * roles, first name, last name, and email address.
     *
     * @param userConfig a configuration for the new User
     * @return a User with properties set by the passed configuration object
     */
    User createUser(UserConfig userConfig);

    /**
     * Adds the passed User to the Engine's data source.
     *
     * @param user the User to store
     */
    void storeUser(User user);

    /**
     * Attempts to retrieve the User with the passed username from the Engine's data source.
     * Returns an Optional with the User if it was found or empty if it could not be found.
     *
     * @param username the username of the User to retrieve
     * @return an Optional that contains the User if present; empty otherwise
     */
    Optional<User> retrieveUser(String username);

    /**
     * Removes the User with the passed username from the Engine's data source.
     *
     * @param username the username of the User to delete
     */
    void deleteUser(String username);

    /**
     * Replaces the User in the Engine's data source with the same identifier as the passed
     * User with the new User object.
     *
     * @param newUser the new User object to replace the existing one
     */
    void updateUser(User newUser);

    /**
     * Returns a boolean indicating whether a User with the passed username exists in the
     * Engine's data source.
     *
     * @param username the username to look for in the Engine's data source
     * @return true if a User exists with the passed username; false otherwise
     */
    boolean userExists(String username);

    /**
     * Returns the Set of all Groups accessible by the Engine's data source.
     *
     * @return a Set of Groups accessible by the Engine
     */
    Set<Group> getGroups();

    /**
     * Creates a Group using the passed configuration object with a title, description,
     * roles, and list of member usernames.
     *
     * @param groupConfig a configuration for the new Group
     * @return a Group with properties set by the passed configuration object
     */
    Group createGroup(GroupConfig groupConfig);

    /**
     * Adds the passed Group to the Engine's data source.
     *
     * @param group the Group to store
     */
    void storeGroup(Group group);

    /**
     * Attempts to retrieve the Group with the passed name from the Engine's data source.
     *
     * @param groupTitle the title of the Group to retrieve
     * @return an Optional that contains the Group if present; empty otherwise
     */
    Optional<Group> retrieveGroup(String groupTitle);

    /**
     * Removes the Group with the passed name from the Engine's data source.
     *
     * @param groupTitle the title of the Group to delete
     */
    void deleteGroup(String groupTitle);

    /**
     * Replaces the Group in the Engine's data source with the same identifier as the passed
     * Group with the new Group object.
     *
     * @param newGroup the new Group object to replace the existing one
     */
    void updateGroup(Group newGroup);

    /**
     * Returns a boolean indicating whether a Group with the passed name exists in the
     * Engine's data source.
     *
     * @param groupTitle the title to look for in the Engine's data source
     * @return true if a Group exists with the passed name; false otherwise
     */
    boolean groupExists(String groupTitle);

    /**
     * Retrieves the Set of all Roles that the User with the passed username embodies.
     * This Set should contain all Roles from all the User's Groups as well.
     *
     * @param username the username of the User to collect the roles for
     * @return the Set of Roles that the User embodies
     */
    Set<Role> getUserRoles(String username);

    /**
     * Returns a boolean indicating whether the passed password matches the saved password
     * for the User with the passed username.
     *
     * @param username the username for the User to test the password of
     * @param password the password to test
     * @return true if the passwords match; false otherwise
     */
    boolean checkPassword(String username, String password);
}
