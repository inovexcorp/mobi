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

    User createUser(String username, String password);

    Group createGroup(String title);

    Set<User> getUsers(String engine);

    boolean storeUser(String engine, User user);

    Optional<User> retrieveUser(String engine, String userId);

    boolean deleteUser(String engine, String userId);

    boolean updateUser(String engine, User newUser);

    boolean userExists(String engine, String userId);

    boolean userExists(String userId);

    Set<Group> getGroups(String engine);

    boolean storeGroup(String engine, Group group);

    Optional<Group> retrieveGroup(String engine, String groupId);

    boolean deleteGroup(String engine, String groupId);

    boolean updateGroup(String engine, Group newGroup);

    boolean groupExists(String engine, String groupId);

    boolean groupExists(String groupId);

    Set<Role> getUserRoles(String engine, String userId);

    Set<Role> getUserRoles(String userId);

    boolean checkPassword(String engine, String userId, String password);
}
