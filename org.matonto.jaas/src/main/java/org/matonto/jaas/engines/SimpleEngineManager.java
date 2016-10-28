package org.matonto.jaas.engines;

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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.apache.log4j.Logger;
import org.matonto.jaas.api.engines.Engine;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.engines.GroupConfig;
import org.matonto.jaas.api.engines.UserConfig;
import org.matonto.jaas.api.ontologies.usermanagement.*;
import org.matonto.rdf.orm.Thing;

import java.util.*;
import java.util.stream.Collectors;

@Component(
        immediate = true,
        name = SimpleEngineManager.COMPONENT_NAME
    )
public class SimpleEngineManager implements EngineManager {
    public static final String COMPONENT_NAME = "org.matonto.jaas.api.engines.EngineManager";
    private final Logger log = Logger.getLogger(SimpleEngineManager.class);
    protected Map<String, Engine> engines = new HashMap<>();

    @Reference(type = '*', dynamic = true)
    public void addEngine(Engine engine) {
        engines.put(engine.getClass().getName(), engine);
    }

    public void removeEngine(Engine engine) {
        engines.remove(engine.getClass().getName());
    }

    @Override
    public boolean containsEngine(String engine) {
        return engines.containsKey(engine);
    }

    @Override
    public Set<User> getUsers(String engine) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).getUsers();
        }
        return new HashSet<>();
    }

    @Override
    public User createUser(String engine, UserConfig userConfig) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).createUser(userConfig);
        }
        return null;
    }

    @Override
    public boolean storeUser(String engine, User user) {
        return engines.containsKey(engine) && engines.get(engine).storeUser(user);
    }

    @Override
    public Optional<User> retrieveUser(String engine, String userId) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).retrieveUser(userId);
        }
        return Optional.empty();
    }

    @Override
    public boolean deleteUser(String engine, String userId) {
        return engines.containsKey(engine) && engines.get(engine).deleteUser(userId);
    }

    @Override
    public boolean updateUser(String engine, User newUser) {
        return engines.containsKey(engine) && engines.get(engine).updateUser(newUser);
    }

    @Override
    public boolean userExists(String engine, String userId) {
        return engines.containsKey(engine) && engines.get(engine).userExists(userId);
    }

    @Override
    public boolean userExists(String userId) {
        for (Engine engine : engines.values()) {
            if (engine.userExists(userId)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public Set<Group> getGroups(String engine) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).getGroups();
        }
        return new HashSet<>();
    }

    @Override
    public Group createGroup(String engine, GroupConfig groupConfig) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).createGroup(groupConfig);
        }
        return null;
    }

    @Override
    public boolean storeGroup(String engine, Group group) {
        return engines.containsKey(engine) && engines.get(engine).storeGroup(group);
    }

    @Override
    public Optional<Group> retrieveGroup(String engine, String groupId) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).retrieveGroup(groupId);
        }
        return Optional.empty();
    }

    @Override
    public boolean deleteGroup(String engine, String groupId) {
        return engines.containsKey(engine) && engines.get(engine).deleteGroup(groupId);
    }

    @Override
    public boolean updateGroup(String engine, Group newGroup) {
        return engines.containsKey(engine) && engines.get(engine).updateGroup(newGroup);
    }

    @Override
    public boolean groupExists(String engine, String groupId) {
        return engines.containsKey(engine) && engines.get(engine).groupExists(groupId);
    }

    @Override
    public boolean groupExists(String groupId) {
        for (Engine engine : engines.values()) {
            if (engine.groupExists(groupId)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public Set<Role> getUserRoles(String engine, String userId) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).getUserRoles(userId);
        }
        return new HashSet<>();
    }

    @Override
    public Set<Role> getUserRoles(String userId) {
        Set<Role> roles = new HashSet<>();
        for (Engine engine : engines.values()) {
            engine.getUserRoles(userId).stream()
                    .filter(role -> !roles.stream()
                            .map(Thing::getResource)
                            .collect(Collectors.toSet()).contains(role.getResource()))
                    .forEach(roles::add);

        }

        return roles;
    }

    @Override
    public boolean checkPassword(String engine, String userId, String password) {
        return engines.containsKey(engine) && engines.get(engine).checkPassword(userId, password);
    }
}
