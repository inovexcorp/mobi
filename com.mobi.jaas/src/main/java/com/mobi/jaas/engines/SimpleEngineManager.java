package com.mobi.jaas.engines;

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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.orm.Thing;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component(immediate = true)
public class SimpleEngineManager implements EngineManager {
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
    public Optional<Role> getRole(String engine, String roleName) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).getRole(roleName);
        }
        return Optional.empty();
    }

    @Override
    public Set<User> getUsers(String engine) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).getUsers();
        }
        return new HashSet<>();
    }

    @Override
    public Set<User> getUsers() {
        Set<User> users = new HashSet<>();
        for (Engine engine : engines.values()) {
            users.addAll(engine.getUsers());
        }
        return users;
    }

    @Override
    public User createUser(String engine, UserConfig userConfig) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).createUser(userConfig);
        }
        return null;
    }

    @Override
    public void storeUser(String engine, User user) {
        if (containsEngine(engine)) {
            engines.get(engine).storeUser(user);
        }
    }

    @Override
    public Optional<User> retrieveUser(String engine, String username) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).retrieveUser(username);
        }
        return Optional.empty();
    }

    @Override
    public Optional<User> retrieveUser(String username) {
        for (Engine engine : engines.values()) {
            Optional<User> optional = engine.retrieveUser(username);
            if (optional.isPresent()) {
                return optional;
            }
        }
        return Optional.empty();
    }

    @Override
    public void deleteUser(String engine, String username) {
        if (containsEngine(engine)) {
            engines.get(engine).deleteUser(username);
        }
    }

    @Override
    public void updateUser(String engine, User newUser) {
        if (containsEngine(engine)) {
            engines.get(engine).updateUser(newUser);
        }
    }

    @Override
    public boolean userExists(String engine, String username) {
        return engines.containsKey(engine) && engines.get(engine).userExists(username);
    }

    @Override
    public boolean userExists(String username) {
        for (Engine engine : engines.values()) {
            if (engine.userExists(username)) {
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
    public void storeGroup(String engine, Group group) {
        if (containsEngine(engine)) {
            engines.get(engine).storeGroup(group);
        }
    }

    @Override
    public Optional<Group> retrieveGroup(String engine, String groupTitle) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).retrieveGroup(groupTitle);
        }
        return Optional.empty();
    }

    @Override
    public void deleteGroup(String engine, String groupTitle) {
        if (containsEngine(engine)) {
            engines.get(engine).deleteGroup(groupTitle);
        }
    }

    @Override
    public void updateGroup(String engine, Group newGroup) {
        if (containsEngine(engine)) {
            engines.get(engine).updateGroup(newGroup);
        }
    }

    @Override
    public boolean groupExists(String engine, String groupTitle) {
        return engines.containsKey(engine) && engines.get(engine).groupExists(groupTitle);
    }

    @Override
    public boolean groupExists(String groupTitle) {
        for (Engine engine : engines.values()) {
            if (engine.groupExists(groupTitle)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public Set<Role> getUserRoles(String engine, String username) {
        if (engines.containsKey(engine)) {
            return engines.get(engine).getUserRoles(username);
        }
        return new HashSet<>();
    }

    @Override
    public Set<Role> getUserRoles(String username) {
        Set<Role> roles = new HashSet<>();
        for (Engine engine : engines.values()) {
            engine.getUserRoles(username).stream()
                    .filter(role -> !roles.stream()
                            .map(Thing::getResource)
                            .collect(Collectors.toSet()).contains(role.getResource()))
                    .forEach(roles::add);

        }
        return roles;
    }

    @Override
    public boolean checkPassword(String engine, String username, String password) {
        return engines.containsKey(engine) && engines.get(engine).checkPassword(username, password);
    }

    @Override
    public Optional<String> getUsername(Resource userIri) {
        for (User user: getUsers()) {
            if (user.getResource().equals(userIri)) {
                return user.getUsername().map(Value::stringValue);
            }
        }
        return Optional.empty();
    }
}
