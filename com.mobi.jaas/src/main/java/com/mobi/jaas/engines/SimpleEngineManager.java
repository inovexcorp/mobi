package com.mobi.jaas.engines;

/*-
 * #%L
 * com.mobi.jaas
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.persistence.utils.Statements;
import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.ExternalGroup;
import com.mobi.jaas.api.ontologies.usermanagement.ExternalUser;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.RoleFactory;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Component(immediate = true)
public class SimpleEngineManager implements EngineManager {
    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());
    private OrmFactoryRegistry factoryRegistry;
    private ValueFactory valueFactory = new ValidatingValueFactory();
    private ModelFactory modelFactory = new DynamicModelFactory();
    private OsgiRepository repository;
    private RoleFactory roleFactory;
    private Resource context;
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

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
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

    @Reference
    public void setOrmFactoryRegistry(OrmFactoryRegistry factoryRegistry) { this.factoryRegistry = factoryRegistry; }

    @Reference
    public void setRoleFactory(RoleFactory roleFactory) { this.roleFactory = roleFactory; }

    @Reference(target = "(id=system)")
    public void setRepository(OsgiRepository repository) { this.repository = repository; }

    @Activate
    void start() {
        context = valueFactory.createIRI("http://mobi.com/usermanagement");
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
            try {
                Optional<Role> optional = engine.getRole(roleName);
                if (optional.isPresent()) {
                    return optional;
                }
            } catch (Exception e) {
                log.debug("Error getting roles for engine " + engine.getEngineName(), e);
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
            try {
                log.debug("Getting users with " + engine.getEngineName());
                users.addAll(engine.getUsers());
            } catch (Exception e) {
                log.debug("Error getting users for engine " + engine.getEngineName(), e);
            }
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
            try {
                Optional<User> optional = engine.retrieveUser(username);
                if (optional.isPresent()) {
                    return optional;
                }
            } catch (Exception e) {
                log.debug("Error retrieving user for engine " + engine.getEngineName(), e);
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
            try {
                if (engine.userExists(newUser.getResource())) {
                    foundEngine = engine;
                }
            } catch (Exception e) {
                log.debug("Error updating user for engine " + engine.getEngineName(), e);
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
            try {
                if (engine.userExists(username)) {
                    return true;
                }
            } catch (Exception e) {
                log.debug("Error checking if user exists for engine " + engine.getEngineName(), e);
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
            try {
                groups.addAll(engine.getGroups());
            } catch (Exception e) {
                log.debug("Error getting groups for engine " + engine.getEngineName(), e);
            }
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
            try {
                Optional<Group> optional = engine.retrieveGroup(groupTitle);
                if (optional.isPresent()) {
                    return optional;
                }
            } catch (Exception e) {
                log.debug("Error retrieving group for engine " + engine.getEngineName(), e);
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
            try {
                if (engine.groupExists(newGroup.getResource())) {
                    foundEngine = engine;
                }
            } catch (Exception e) {
                log.debug("Error for engine " + engine.getEngineName(), e);
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
            try {
                if (engine.groupExists(groupTitle)) {
                    return true;
                }
            } catch (Exception e) {
                log.debug("Error checking if group exist for engine " + engine.getEngineName(), e);
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
            try {
                if (engine.userExists(username)) {
                    engine.getUserRoles(username).stream()
                            .filter(role -> !roles.stream()
                                    .map(Thing::getResource)
                                    .collect(Collectors.toSet()).contains(role.getResource()))
                            .forEach(roles::add);
                }
            } catch (Exception e) {
                log.debug("Error getting User Roles for engine " + engine.getEngineName(), e);
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
            try {
                if (engine.checkPassword(username, password)) {
                    return true;
                }
            } catch (Exception e) {
                log.debug("Error checking password for engine " + engine.getEngineName(), e);
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

    @Override
    public <T extends ExternalUser> T mergeUser(T externalUser, User existingUser) {
        OrmFactory<? extends ExternalUser> factory = getSpecificExternalUserFactory(externalUser);
        Model newUserWithExistingIRI = modelFactory.createEmptyModel();
        for (Statement statement : externalUser.getModel()) {
            newUserWithExistingIRI.add(existingUser.getResource(), statement.getPredicate(), statement.getObject());
        }

        Optional<? extends ExternalUser> newUserOpt = factory.getExisting(existingUser.getResource(),
                newUserWithExistingIRI);
        T newExternalUser = (T) newUserOpt.get();
        // Combine Roles
        for (Resource role: existingUser.getHasUserRole_resource()) {
            Role currentRole = roleFactory.createNew(role);
            newExternalUser.addHasUserRole(currentRole);
        }

        try (RepositoryConnection conn = repository.getConnection()) {
            // Remove existingUser since it will be replaced with newExternalUser
            conn.remove(existingUser.getResource(), null, null, context);
            conn.add(newExternalUser.getModel(), context);
        }
        return newExternalUser;
    }

    @Override
    public <T extends ExternalGroup> T mergeGroup(T externalGroup, Group existingGroup) {
        OrmFactory<? extends ExternalGroup> factory = getSpecificExternalGroupFactory(externalGroup);
        Model newGroupWithExistingIRI = modelFactory.createEmptyModel();
        for (Statement statement : externalGroup.getModel()) {
            newGroupWithExistingIRI.add(existingGroup.getResource(), statement.getPredicate(), statement.getObject());
        }

        Optional<? extends ExternalGroup> newGroupOpt = factory.getExisting(existingGroup.getResource(),
                newGroupWithExistingIRI);
        T newExternalGroup = (T) newGroupOpt.get();
        // Combine Roles
        for (Resource role: existingGroup.getHasGroupRole_resource()) {
            Role currentRole = roleFactory.createNew(role);
            newExternalGroup.addHasGroupRole(currentRole);
        }

        // Add previous members of group
        for (User member : getGroupMembers(existingGroup)) {
            newExternalGroup.addMember(member);
        }

        try (RepositoryConnection conn = repository.getConnection()) {
            // Remove existingGroup since it will be replaced with newExternalGroup
            conn.remove(existingGroup.getResource(), null, null, context);
            conn.add(newExternalGroup.getModel(), context);
        }
        return newExternalGroup;
    }

    /** TODO: Make a more generic method and move it to the OrmFactoryRegistry **/
    @Override
    public OrmFactory<? extends ExternalUser> getSpecificExternalUserFactory(User user) {
        List<Resource> types = user.getModel().filter(user.getResource(),
                        valueFactory.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), null)
                .stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());

        List<OrmFactory<? extends ExternalUser>> orderedFactories = factoryRegistry
                .getSortedFactoriesOfType(ExternalUser.class)
                .stream()
                .filter(ormFactory -> {
                    try {
                        return !ormFactory.getTypeIRI().stringValue().equals(ExternalUser.class.getDeclaredField("TYPE")
                                .get(null).toString());
                    } catch (Exception e) {
                        throw new IllegalStateException("Cannot retrieve type from " + ExternalUser.class.getName());
                    }
                })
                .filter(ormFactory -> types.contains(ormFactory.getTypeIRI()))
                .collect(Collectors.toList());

        if (orderedFactories.size() == 0) {
            throw new IllegalArgumentException("User type is not a subclass of ExternalUser");
        }

        return orderedFactories.get(0);
    }

    /** TODO: Make a more generic method and move it to the OrmFactoryRegistry. **/
    @Override
    public OrmFactory<? extends ExternalGroup> getSpecificExternalGroupFactory(Group group) {
        List<Resource> types = group.getModel().filter(group.getResource(),
                        valueFactory.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), null)
                .stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());

        List<OrmFactory<? extends ExternalGroup>> orderedFactories = factoryRegistry
                .getSortedFactoriesOfType(ExternalGroup.class)
                .stream()
                .filter(ormFactory -> {
                    try {
                        return !ormFactory.getTypeIRI().stringValue().equals(ExternalGroup.class
                                .getDeclaredField("TYPE").get(null).toString());
                    } catch (Exception e) {
                        throw new IllegalStateException("Cannot retrieve type from " + ExternalGroup.class.getName());
                    }
                })
                .filter(ormFactory -> types.contains(ormFactory.getTypeIRI()))
                .collect(Collectors.toList());

        if (orderedFactories.size() == 0) {
            throw new IllegalArgumentException("Group type is not a subclass of ExternalGroup");
        }

        return orderedFactories.get(0);
    }

    @Override
    public Set<User> getGroupMembers(Group group) {
        return group.getMember_resource().stream()
                .map(iri -> getUsername(iri).orElseThrow(() ->
                        new IllegalArgumentException("Cannot find user for iri: " + iri)))
                .map(username -> retrieveUser(username).orElseThrow(() ->
                        new IllegalArgumentException("Cannot find user for username: " + username)))
                .collect(Collectors.toSet());
    }
}
