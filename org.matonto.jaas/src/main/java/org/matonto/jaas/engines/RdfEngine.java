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

import aQute.bnd.annotation.component.*;
import org.apache.log4j.Logger;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.Engine;
import org.matonto.jaas.api.ontologies.usermanagement.*;
import org.matonto.ontologies.foaf.Agent;
import org.matonto.ontologies.foaf.AgentFactory;
import org.matonto.rdf.api.*;
import org.matonto.rdf.orm.Thing;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.config.RepositoryConsumerConfig;
import org.matonto.repository.exception.RepositoryException;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component(
        name = RdfEngine.COMPONENT_NAME,
        designateFactory = RepositoryConsumerConfig.class,
        configurationPolicy = ConfigurationPolicy.require)
public class RdfEngine implements Engine {
    static final String COMPONENT_NAME = "org.matonto.jaas.engines.RdfEngine";
    private static final Logger logger = Logger.getLogger(RdfEngine.class);

    private final String ADMIN_ROLE = "http://matonto.org/roles/admin";
    private final String USER_ROLE = "http://matonto.org/roles/user";
    private final String ADMIN_USER = "http://matonto.org/users/admin";
    private Resource userContext;
    private Repository repository;
    private ValueFactory factory;
    private ModelFactory modelFactory;
    private UserFactory userFactory;
    private GroupFactory groupFactory;
    private RoleFactory roleFactory;
    private AgentFactory agentFactory;

    @Activate
    public void activate() {
        logger.info("Activating " + COMPONENT_NAME);
        initUserManagerResources();

        RepositoryConnection conn = repository.getConnection();
        conn.begin();
        if (!resourceExists(factory.createIRI(ADMIN_ROLE))) {
            conn.add(roleFactory.createNew(factory.createIRI(ADMIN_ROLE)).getModel());
        }
        if (!resourceExists(factory.createIRI(USER_ROLE))) {
            conn.add(roleFactory.createNew(factory.createIRI(USER_ROLE)).getModel());
        }
        if (!resourceExists(factory.createIRI(ADMIN_USER))) {
            Role adminRole = roleFactory.createNew(factory.createIRI(ADMIN_ROLE));
            Role userRole = roleFactory.createNew(factory.createIRI(USER_ROLE));
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            roles.add(userRole);
            User admin = userFactory.createNew(factory.createIRI(ADMIN_USER));
            admin.setPassword(factory.createLiteral("admin"));
            admin.setHasUserRole(roles);
            conn.add(admin.getModel());
        }
        conn.commit();
        conn.close();
    }

    @Deactivate
    public void deactivate() {
        logger.info("Deactivating " + COMPONENT_NAME);
    }

    @Modified
    public void modified() {
        logger.info("Modifying the " + COMPONENT_NAME);
        initUserManagerResources();
    }

    @Reference(name = "repository")
    protected void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    protected void setValueFactory(final ValueFactory vf) {
        factory = vf;
    }

    @Reference
    protected void setModelFactory(final ModelFactory mf) {
        modelFactory = mf;
    }

    @Reference
    protected void setUserFactory(UserFactory userFactory) {
        this.userFactory = userFactory;
    }

    @Reference
    protected void setGroupFactory(GroupFactory groupFactory) {
        this.groupFactory = groupFactory;
    }

    @Reference
    protected void setRoleFactory(RoleFactory roleFactory) {
        this.roleFactory= roleFactory;
    }

    @Reference
    protected void setAgentFactory(AgentFactory agentFactory) {
        this.agentFactory = agentFactory;
    }

    @Override
    public Set<User> getUsers() {
        Set<User> users = new HashSet<>();
        Model usersModel = modelFactory.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(null, null, null, userContext);
            statements.forEach(usersModel::add);
            users.addAll(userFactory.getAllExisting(usersModel));
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
        return users;
    }

    @Override
    public boolean storeUser(User user) {
        if (userExists(user.getResource().stringValue())) {
            throw new MatOntoException("User with that id already exists");
        }

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(user.getModel(), userContext);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
        return true;
    }

    @Override
    public boolean userExists(String userId) {
        return resourceExists(factory.createIRI(userId));
    }

    @Override
    public Optional<User> retrieveUser(String userId) {
        if (!userExists(userId)) {
            return Optional.empty();
        }

        Model userModel = modelFactory.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(factory.createIRI(userId), null, null, userContext);
            statements.forEach(userModel::add);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
        return Optional.of(userFactory.getExisting(factory.createIRI(userId), userModel));
    }

    @Override
    public boolean updateUser(User newUser) {
        if (!userExists(newUser.getResource().stringValue())) {
            throw new MatOntoException("User with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(newUser.getResource(), null, null, userContext);
            conn.add(newUser.getModel(), userContext);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }

        return true;
    }

    @Override
    public boolean deleteUser(String userId) {
        if (!userExists(userId)) {
            throw new MatOntoException("User with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(factory.createIRI(userId), null, null, userContext);
            conn.remove(null, null, (Value) factory.createIRI(userId), userContext);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }

        return true;
    }

    @Override
    public Set<Group> getGroups() {
        Set<Group> groups = new HashSet<>();
        Model groupsModel = modelFactory.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(null, null, null, userContext);
            statements.forEach(groupsModel::add);
            groups.addAll(groupFactory.getAllExisting(groupsModel));
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
        return groups;
    }

    @Override
    public boolean storeGroup(Group group) {
        if (groupExists(group.getResource().stringValue())) {
            throw new MatOntoException("Group with that id already exists");
        }

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(group.getModel(), userContext);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
        return true;
    }

    @Override
    public boolean groupExists(String groupId) {
        return resourceExists(factory.createIRI(groupId));
    }

    @Override
    public Optional<Group> retrieveGroup(String groupId) {
        if (!groupExists(groupId)) {
            return Optional.empty();
        }

        Model groupModel = modelFactory.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(factory.createIRI(groupId), null, null, userContext);
            statements.forEach(groupModel::add);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
        return Optional.of(groupFactory.getExisting(factory.createIRI(groupId), groupModel));
    }

    @Override
    public boolean updateGroup(Group newGroup) {
        if (!groupExists(newGroup.getResource().stringValue())) {
            throw new MatOntoException("Group with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(newGroup.getResource(), null, null, userContext);
            conn.add(newGroup.getModel(), userContext);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }

        return true;
    }

    @Override
    public boolean deleteGroup(String groupId) {
        if (!groupExists(groupId)) {
            throw new MatOntoException("Group with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(factory.createIRI(groupId), null, null, userContext);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }

        return true;
    }

    @Override
    public Set<Role> getUserRoles(String userId) {
        if (!userExists(userId)) {
            throw new MatOntoException("User with that id does not exist");
        }
        Set<Role> roles = new HashSet<>();
        Optional<User> userOptional = retrieveUser(userId);
        if (!userOptional.isPresent()) {
            throw new MatOntoException("Could not retrieve user");
        }
        roles.addAll(userOptional.get().getHasUserRole());
        getGroups().stream()
                .filter(group -> group.getMember().stream()
                        .map(Thing::getResource)
                        .collect(Collectors.toSet()).contains(factory.createIRI(userId)))
                .map(Group::getHasGroupRole)
                .forEach(groupRoles -> groupRoles.stream()
                        .filter(role -> !roles.stream()
                                .map(Thing::getResource)
                                .collect(Collectors.toSet()).contains(role.getResource()))
                        .forEach(roles::add));

        return roles;
    }

    @Override
    public boolean checkPassword(String userId, String password) {
        return false;
    }

    private void initUserManagerResources() {
        userContext = factory.createIRI("http://matonto.org/usermanagement");
    }

    private boolean resourceExists(Resource resource) {
        RepositoryConnection conn = repository.getConnection();
        boolean exists = conn.getStatements(resource, null, null, userContext).hasNext();
        conn.close();
        return exists;
    }
}
