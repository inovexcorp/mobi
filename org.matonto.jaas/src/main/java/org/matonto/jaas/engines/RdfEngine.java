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
import org.matonto.rdf.api.*;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.config.RepositoryConsumerConfig;
import org.matonto.repository.exception.RepositoryException;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

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

    @Override
    public Set<User> getUsers() {
        Set<User> users = new HashSet<>();
        Model usersModel = modelFactory.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(null, null, null, userContext);
            statements.forEach(usersModel::add);
            System.out.println(userFactory.getAllExisting(usersModel).size());
            users.addAll(userFactory.getAllExisting(usersModel));
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
        return users;
    }

    @Override
    public boolean storeUser(User user) {
        return false;
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
    public boolean updateUser(String userId, User newUser) {
        return false;
    }

    @Override
    public boolean deleteUser(String userId) {
        return false;
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
        return false;
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
    public boolean updateGroup(String groupId, Group newGroup) {
        return false;
    }

    @Override
    public boolean deleteGroup(String groupId) {
        return false;
    }

    @Override
    public Set<Role> getUserRoles(String userId) {
        return null;
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
