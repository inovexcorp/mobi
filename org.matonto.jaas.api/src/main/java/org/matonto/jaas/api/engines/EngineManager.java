package org.matonto.jaas.api.engines;

/*-
 * #%L
 * org.matonto.jaas.api
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

import org.matonto.jaas.api.ontologies.usermanagement.Group;
import org.matonto.jaas.api.ontologies.usermanagement.Role;
import org.matonto.jaas.api.ontologies.usermanagement.User;

import java.util.Optional;
import java.util.Set;

public interface EngineManager {
    boolean containsEngine(String engine);

    User createUser(String engine, UserConfig userConfig);

    Group createGroup(String engine, GroupConfig groupConfig);

    Set<User> getUsers(String engine);

    boolean storeUser(String engine, User user);

    Optional<User> retrieveUser(String engine, String username);

    boolean deleteUser(String engine, String username);

    boolean updateUser(String engine, User newUser);

    boolean userExists(String engine, String username);

    boolean userExists(String username);

    Set<Group> getGroups(String engine);

    boolean storeGroup(String engine, Group group);

    Optional<Group> retrieveGroup(String engine, String groupName);

    boolean deleteGroup(String engine, String groupName);

    boolean updateGroup(String engine, Group newGroup);

    boolean groupExists(String engine, String groupName);

    boolean groupExists(String groupName);

    Set<Role> getUserRoles(String engine, String username);

    Set<Role> getUserRoles(String username);

    boolean checkPassword(String engine, String username, String password);
}
