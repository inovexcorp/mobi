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

import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.Resource;

import java.util.Optional;
import java.util.Set;

public interface EngineManager {
    /**
     * Returns a boolean indicating whether the {@link EngineManager} contains an {@link Engine} with the provided name.
     *
     * @param engine the name of the {@link Engine} to test for
     * @return true if the {@link Engine} is in the manager; false otherwise
     */
    boolean containsEngine(String engine);

    /**
     * Attempts to retrieve the {@link Role} with the provided name using the {@link Engine} with the provided name.
     * Returns an {@link Optional} with the {@link Role} if it exists for the {@link Engine}.
     *
     * @param engine the name of the {@link Engine} to use when retrieving the {@link Role}
     * @param roleName the name of the {@link Role} to retrieve
     * @return an {@link Optional} containing the {@link Role} if present; {@link Optional#empty()} otherwise
     */
    Optional<Role> getRole(String engine, String roleName);

    /**
     * Attempts to retrieve the {@link Role} with the provided name from one of the {@link Engine Engines} the
     * {@link EngineManager} manages. Returns an {@link Optional} with the {@link Role} if it was found.
     *
     * @param roleName the name of the {@link Role} to retrieve
     * @return an {@link Optional} containing the {@link Role} if present; {@link Optional#empty()} otherwise
     */
    Optional<Role> getRole(String roleName);

    /**
     * Returns the {@link Set} of {@link User Users} accessible by the {@link Engine} with the provided name.
     *
     * @param engine the name of the {@link Engine} to collect {@link User Users} from
     * @return the {@link Set} of {@link User Users} accessible by the specified {@link Engine}
     */
    Set<User> getUsers(String engine);

    /**
     * Returns the {@link Set} of {@link User Users} accessible by all {@link Engine Engines} managed by the
     * {@link EngineManager}.
     *
     * @return the {@link Set} of all {@link User Users} accessible by the {@link EngineManager}
     */
    Set<User> getUsers();

    /**
     * Creates a new {@link User} object using the {@link Engine} with the provided name.
     *
     * @param engine the name of the {@link Engine} to use when creating the {@link User}
     * @param userConfig a {@link UserConfig} for the new {@link User}
     * @return a {@link User} with properties set by the provided configuration object as determined by the specified
     *      {@link Engine}
     */
    User createUser(String engine, UserConfig userConfig);

    /**
     * Stores the provided {@link User} using the {@link Engine} with the provided name. If the {@link Engine} is not in
     * the manager, does nothing.
     *
     * @param engine the name of the {@link Engine} to store the {@link User} with
     * @param user the {@link User} to store
     */
    void storeUser(String engine, User user);

    /**
     * Attempts to retrieve the {@link User} with the provided username using the {@link Engine} with the provided name.
     * Returns an {@link Optional} with the {@link User} if it was found.
     *
     * @param engine the name of the {@link Engine} to retrieve the {@link User} with
     * @param username the username of the {@link User} to retrieve
     * @return an {@link Optional} that contains the {@link User} if present; {@link Optional#empty()} otherwise
     */
    Optional<User> retrieveUser(String engine, String username);

    /**
     * Attempts to retrieve the {@link User} with the provided username from one of the {@link Engine Engines} the
     * {@link EngineManager} manages. Returns an {@link Optional} with the {@link User} if it was found.
     *
     * @param username the username of the {@link User} to retrieve
     * @return an {@link Optional} that contains the {@link User} if present; {@link Optional#empty()} otherwise
     */
    Optional<User> retrieveUser(String username);

    /**
     * Removes the {@link User} with the provided username using the {@link Engine} with the provided name. If the
     * {@link Engine} is not in the manager, does nothing.
     *
     * @param engine the name of the {@link Engine} to delete the {@link User} with
     * @param username the username of the {@link User} to delete
     */
    void deleteUser(String engine, String username);

    /**
     * Replaces the matching {@link User} with the provided {@link User} using the {@link Engine} with the provided
     * name. If the {@link Engine} is not in the manager, does nothing.
     *
     * @param engine the name of the {@link Engine} to update the {@link User} with
     * @param newUser the new {@link User} object to replace the existing one
     */
    void updateUser(String engine, User newUser);

    /**
     * Replaces the matching {@link User} with the provided {@link User} using the {@link Engine} that manages the
     * {@link User}. If not {@link Engine} manages the {@link User}, does nothing.
     *
     * @param newUser the new {@link User} object to replace the existing one
     */
    void updateUser(User newUser);

    /**
     * Returns a boolean indicating whether a {@link User} with the provided username exists using the {@link Engine}
     * with the provided name.
     *
     * @param engine the name of the {@link Engine} to test for the existence of the {@link User} with
     * @param username the username to look for
     * @return true if a {@link User} exists with the provided username; false otherwise
     */
    boolean userExists(String engine, String username);

    /**
     * Returns a boolean indicating whether a {@link User} with the provided username exists using any of the
     * {@link Engine Engines} managed by the {@link EngineManager}.
     *
     * @param username the username to look for
     * @return true if a {@link User} exists with the provided username; false otherwise
     */
    boolean userExists(String username);

    /**
     * Returns the {@link Set} of {@link Group Groups} accessible by the {@link Engine} with the provided name.
     *
     * @param engine the name of the {@link Engine} to collect {@link Group Groups} from
     * @return the {@link Set} of {@link Group Groups} accessible by the specified {@link Engine}
     */
    Set<Group> getGroups(String engine);

    /**
     * Returns the {@link Set} of {@link Group Groups} accessible by all {@link Engine Engines} managed by the
     * {@link EngineManager}.
     *
     * @return the {@link Set} of all {@link Group Groups} accessible by the {@link EngineManager}
     */
    Set<Group> getGroups();

    /**
     * Creates a new {@link Group} object using the {@link Engine} with the provided name.
     *
     * @param engine the name of the {@link Engine} to use when creating the {@link Group}
     * @param groupConfig a {@link GroupConfig} for the new {@link Group}
     * @return a {@link Group} with properties set by the provided configuration object as determined
     *      by the specified {@link Engine}
     */
    Group createGroup(String engine, GroupConfig groupConfig);

    /**
     * Stores the provided {@link Group} using the {@link Engine} with the provided name. If the {@link Engine} is not
     * in the manager, does nothing.
     *
     * @param engine the name of the {@link Engine} to store the {@link Group} with
     * @param group the {@link Group} to store
     */
    void storeGroup(String engine, Group group);

    /**
     * Attempts to retrieve the {@link Group} with the provided title using the {@link Engine} with the provided
     * username. Returns an {@link Optional} with the {@link Group} if it was found.
     *
     * @param engine the name of the {@link Engine} to retrieve the {@link Group} with
     * @param groupTitle the title of the {@link Group} to retrieve
     * @return an {@link Optional} that contains the {@link Group} if present; {@link Optional#empty()} otherwise
     */
    Optional<Group> retrieveGroup(String engine, String groupTitle);

    /**
     * Attempts to retrieve the {@link Group} with the provided title from one of the {@link Engine Engines} the
     * {@link EngineManager} manages. Returns an {@link Optional} with the {@link Group} if it was found.
     *
     * @param groupTitle the title of the {@link Group} to retrieve
     * @return an {@link Optional} that contains the {@link Group} if present; {@link Optional#empty()} otherwise
     */
    Optional<Group> retrieveGroup(String groupTitle);

    /**
     * Removes the {@link Group} with the provided name using the {@link Engine} with the provided name.
     * If the {@link Engine} is not in the manager, does nothing.
     *
     * @param engine the name of the {@link Engine} to delete the {@link Group} with
     * @param groupTitle the title of the {@link Group} to delete
     */
    void deleteGroup(String engine, String groupTitle);

    /**
     * Replaces the matching {@link Group} with the provided {@link Group} using the {@link Engine} with the provided
     * name. If the {@link Engine} is not in the manager, does nothing.
     *
     * @param engine the name of the {@link Engine} to update the {@link Group} with
     * @param newGroup the new {@link Group} object to replace the existing one
     */
    void updateGroup(String engine, Group newGroup);

    /**
     * Replaces the matching {@link Group} with the provided {@link Group} using the {@link Engine} that manages the
     * {@link Group}. If not {@link Engine} manages the {@link Group}, does nothing.
     *
     * @param newGroup the new {@link Group} object to replace the existing one
     */
    void updateGroup(Group newGroup);

    /**
     * Returns a boolean indicating whether a {@link Group} with the provided name exists using the {@link Engine} with
     * the provided name.
     *
     * @param engine the name of the {@link Engine} to test for the existence of the {@link Group} with
     * @param groupTitle the title of the {@link Group} to look for
     * @return true if a {@link Group} exists with the provided name; false otherwise
     */
    boolean groupExists(String engine, String groupTitle);

    /**
     * Returns a boolean indicating whether a {@link Group} with the provided name exists using any of the
     * {@link Engine Engines} managed by the {@link EngineManager}.
     *
     * @param groupTitle the title of the {@link Group} to look for
     * @return true if a {@link Group} exists with the provided name; false otherwise
     */
    boolean groupExists(String groupTitle);

    /**
     * Retrieves the {@link Set} of all {@link Role Roles} that the {@link User} with the provided username embodies
     * using the {@link Engine} with the provided name. This {@link Set} should contain all {@link Role Roles} from all
     * the User's {@link Group Groups} as well.
     *
     * @param engine the name of the {@link Engine} to collect {@link User} {@link Role Roles} from
     * @param username the username of the {@link User} to collect the {@link Role Roles} for
     * @return the {@link Set} of {@link Role Roles} that the {@link User} embodies
     */
    Set<Role> getUserRoles(String engine, String username);

    /**
     * Retrieves the full {@link Set} of all {@link Role Roles} that the {@link User} with the provided username
     * embodies using all {@link Engine Engines} managed by the {@link EngineManager}. This {@link Set} should contain
     * all {@link Role Roles} from all the User's {@link Group Groups} as well.
     *
     * @param username the username of the {@link User} to collect the {@link Role Roles} for
     * @return the {@link Set} of {@link Role Roles} that the {@link User} embodies
     */
    Set<Role> getUserRoles(String username);

    /**
     * Returns a boolean indicating whether the provided password matches the saved password for the {@link User} with
     * the provided username using the {@link Engine} with the provided name.
     *
     * @param engine the name of the {@link Engine} to use when testing passwords
     * @param username the username for the {@link User} to test the password of
     * @param password the password to test
     * @return true if the passwords match; false otherwise
     */
    boolean checkPassword(String engine, String username, String password);

    /**
     * Returns a boolean indicating whether the provided password matches the saved password for the {@link User} with
     * the provided username using any of the {@link Engine Engines} managed by the {@link EngineManager}. If the
     * credentials match in any of the {@link Engine Engines}, returns true.
     *
     * @param username the username for the {@link User} to test the password of
     * @param password the password to test
     * @return true if the passwords match; false otherwise
     */
    boolean checkPassword(String username, String password);

    /**
     * Attempts to find the username of a {@link User} associated with the provided IRI using all the
     * {@link Engine Engines} managed by the {@link EngineManager}.
     *
     * @param userIri the IRI to search for
     * @return an {@link Optional} with the username of the associated {@link User} if found;
     *      {@link Optional#empty()} otherwise
     */
    Optional<String> getUsername(Resource userIri);
}
