package com.mobi.jaas.engines;

/*-
 * #%L
 * com.mobi.jaas
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Component(immediate = true)
public class SimpleEngineManager implements EngineManager {
    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());
    protected Map<String, Engine> engines = new TreeMap<>((e1, e2) -> {
        if (e1.equals(e2)) {
            return 0;
        }
        if (e1.equals(RdfEngine.ENGINE_NAME)) {
            return 1;
        } else if (e2.equals(RdfEngine.ENGINE_NAME)) {
            return -1;
        } else {
            return e1.compareTo(e2);
        }
    });

    @Reference(type = '*', dynamic = true)
    public void addEngine(Engine engine) {
        engines.put(engine.getEngineName(), engine);
    }

    public void removeEngine(Engine engine) {
        engines.remove(engine.getEngineName());
    }

    @Override
    public boolean containsEngine(String engine) {
        return engines.containsKey(engine);
    }

    @Override
    public Optional<Role> getRole(String engine, String roleName) {
        log.debug("Getting roles with " + engine);
        if (engines.containsKey(engine)) {
            return engines.get(engine).getRole(roleName);
        }
        return Optional.empty();
    }

    @Override
    public Optional<Role> getRole(String roleName) {
        for (Engine engine : engines.values()) {
            log.debug("Getting roles with " + engine.getEngineName());
            Optional<Role> optional = engine.getRole(roleName);
            if (optional.isPresent()) {
                return optional;
            }
        }
        return Optional.empty();
    }

    @Override
    public Set<User> getUsers(String engine) {
        log.debug("Getting users with " + engine);
        if (engines.containsKey(engine)) {
            return engines.get(engine).getUsers();
        }
        return new HashSet<>();
    }

    @Override
    public Set<User> getUsers() {
        Set<User> users = new HashSet<>();
        for (Engine engine : engines.values()) {
            log.debug("Getting users with " + engine.getEngineName());
            users.addAll(engine.getUsers());
        }
        return users;
    }

    @Override
    public User createUser(String engine, UserConfig userConfig) {
        log.debug("Creating user with " + engine);
        if (engines.containsKey(engine)) {
            return engines.get(engine).createUser(userConfig);
        }
        return null;
    }

    @Override
    public void storeUser(String engine, User user) {
        log.debug("Storing user with " + engine);
        if (containsEngine(engine)) {
            engines.get(engine).storeUser(user);
        }
    }

    @Override
    public Optional<User> retrieveUser(String engine, String username) {
        log.debug("Retrieving user with " + engine);
        if (engines.containsKey(engine)) {
            return engines.get(engine).retrieveUser(username);
        }
        return Optional.empty();
    }

    @Override
    public Optional<User> retrieveUser(String username) {
        for (Engine engine : engines.values()) {
            log.debug("Retrieving user with " + engine.getEngineName());
            Optional<User> optional = engine.retrieveUser(username);
            if (optional.isPresent()) {
                return optional;
            }
        }
        return Optional.empty();
    }

    @Override
    public void deleteUser(String engine, String username) {
        log.debug("Deleting user with" + engine);
        if (containsEngine(engine)) {
            engines.get(engine).deleteUser(username);
        }
    }

    @Override
    public void updateUser(String engine, User newUser) {
        log.debug("Updating user with" + engine);
        if (containsEngine(engine)) {
            engines.get(engine).updateUser(newUser);
        }
    }

    @Override
    public void updateUser(User newUser) {
        Engine foundEngine = null;
        for (Engine engine : engines.values()) {
            if (engine.userExists(newUser.getResource())) {
                foundEngine = engine;
            }
        }
        if (foundEngine != null) {
            log.debug("Updating user with " + foundEngine.getEngineName());
            foundEngine.updateUser(newUser);
        }
    }

    @Override
    public boolean userExists(String engine, String username) {
        log.debug("Checking user exists with " + engine);
        return engines.containsKey(engine) && engines.get(engine).userExists(username);
    }

    @Override
    public boolean userExists(String username) {
        for (Engine engine : engines.values()) {
            log.debug("Checking user exists with " + engine.getEngineName());
            if (engine.userExists(username)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public Set<Group> getGroups(String engine) {
        log.debug("Getting groups with " + engine);
        if (engines.containsKey(engine)) {
            return engines.get(engine).getGroups();
        }
        return new HashSet<>();
    }

    @Override
    public Set<Group> getGroups() {
        Set<Group> groups = new HashSet<>();
        for (Engine engine : engines.values()) {
            log.debug("Getting groups with " + engine.getEngineName());
            groups.addAll(engine.getGroups());
        }
        return groups;
    }

    @Override
    public Group createGroup(String engine, GroupConfig groupConfig) {
        log.debug("Creating group with " + engine);
        if (engines.containsKey(engine)) {
            return engines.get(engine).createGroup(groupConfig);
        }
        return null;
    }

    @Override
    public void storeGroup(String engine, Group group) {
        log.debug("Storing group with " + engine);
        if (containsEngine(engine)) {
            engines.get(engine).storeGroup(group);
        }
    }

    @Override
    public Optional<Group> retrieveGroup(String engine, String groupTitle) {
        log.debug("Retrieving group with " + engine);
        if (engines.containsKey(engine)) {
            return engines.get(engine).retrieveGroup(groupTitle);
        }
        return Optional.empty();
    }

    @Override
    public Optional<Group> retrieveGroup(String groupTitle) {
        for (Engine engine : engines.values()) {
            log.debug("Retrieving group with " + engine.getEngineName());
            Optional<Group> optional = engine.retrieveGroup(groupTitle);
            if (optional.isPresent()) {
                return optional;
            }
        }
        return Optional.empty();
    }

    @Override
    public void deleteGroup(String engine, String groupTitle) {
        if (containsEngine(engine)) {
            log.debug("Deleting group with " + engine);
            engines.get(engine).deleteGroup(groupTitle);
        }
    }

    @Override
    public void updateGroup(String engine, Group newGroup) {
        log.debug("Updating group with " + engine);
        if (containsEngine(engine)) {
            engines.get(engine).updateGroup(newGroup);
        }
    }

    @Override
    public void updateGroup(Group newGroup) {
        Engine foundEngine = null;
        for (Engine engine : engines.values()) {
            if (engine.groupExists(newGroup.getResource())) {
                foundEngine = engine;
            }
        }
        if (foundEngine != null) {
            log.debug("Updating group with " + foundEngine.getEngineName());
            foundEngine.updateGroup(newGroup);
        }
    }

    @Override
    public boolean groupExists(String engine, String groupTitle) {
        log.debug("Checking group exists with " + engine);
        return engines.containsKey(engine) && engines.get(engine).groupExists(groupTitle);
    }

    @Override
    public boolean groupExists(String groupTitle) {
        for (Engine engine : engines.values()) {
            log.debug("Checking group exists with " + engine.getEngineName());
            if (engine.groupExists(groupTitle)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public Set<Role> getUserRoles(String engine, String username) {
        log.debug("Checking user roles with " + engine);
        if (engines.containsKey(engine)) {
            return engines.get(engine).getUserRoles(username);
        }
        return new HashSet<>();
    }

    @Override
    public Set<Role> getUserRoles(String username) {
        Set<Role> roles = new HashSet<>();
        for (Engine engine : engines.values()) {
            log.debug("Checking user roles with " + engine.getEngineName());
            if (engine.userExists(username)) {
                engine.getUserRoles(username).stream()
                        .filter(role -> !roles.stream()
                                .map(Thing::getResource)
                                .collect(Collectors.toSet()).contains(role.getResource()))
                        .forEach(roles::add);
            }
        }
        return roles;
    }

    @Override
    public boolean checkPassword(String engine, String username, String password) {
        log.debug("Checking password with " + engine);
        return engines.containsKey(engine) && engines.get(engine).checkPassword(username, password);
    }

    @Override
    public boolean checkPassword(String username, String password) {
        for (Engine engine : engines.values()) {
            log.debug("Checking password with " + engine.getEngineName());
            if (engine.checkPassword(username, password)) {
                return true;
            }
        }
        return false;
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
