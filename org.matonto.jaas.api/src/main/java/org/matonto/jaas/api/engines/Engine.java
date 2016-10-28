package org.matonto.jaas.api.engines;

/*-
 * #%L
 * org.matonto.jaas
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

public interface Engine {
    Set<User> getUsers();

    User createUser(UserConfig userConfig);

    boolean storeUser(User user);

    Optional<User> retrieveUser(String userId);

    boolean deleteUser(String userId);

    boolean updateUser(User newUser);

    boolean userExists(String userId);

    Set<Group> getGroups();

    Group createGroup(GroupConfig groupConfig);

    boolean storeGroup(Group group);

    Optional<Group> retrieveGroup(String groupId);

    boolean deleteGroup(String groupId);

    boolean updateGroup(Group newGroup);

    boolean groupExists(String groupId);

    Set<Role> getUserRoles(String userId);

    boolean checkPassword(String userId, String password);
}
