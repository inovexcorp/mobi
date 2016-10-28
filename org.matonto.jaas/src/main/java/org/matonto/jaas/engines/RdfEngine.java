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
import aQute.bnd.annotation.metatype.Configurable;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.karaf.jaas.modules.Encryption;
import org.apache.karaf.jaas.modules.encryption.EncryptionSupport;
import org.apache.log4j.Logger;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.Engine;
import org.matonto.jaas.api.engines.GroupConfig;
import org.matonto.jaas.api.engines.UserConfig;
import org.matonto.jaas.api.ontologies.usermanagement.*;
import org.matonto.ontologies.foaf.Agent;
import org.matonto.ontologies.foaf.AgentFactory;
import org.matonto.rdf.api.*;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.impl.ThingFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.config.RepositoryConsumerConfig;
import org.matonto.repository.exception.RepositoryException;
import org.openrdf.model.vocabulary.DCTERMS;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component(
        name = RdfEngine.COMPONENT_NAME,
        designateFactory = RdfEngineConfig.class,
        configurationPolicy = ConfigurationPolicy.require
)
public class RdfEngine implements Engine {
    static final String COMPONENT_NAME = "org.matonto.jaas.engines.RdfEngine";
    private static final Logger logger = Logger.getLogger(RdfEngine.class);

    private final String ADMIN_ROLE = "http://matonto.org/roles/admin";
    private final String USER_ROLE = "http://matonto.org/roles/user";
    private final String ADMIN_USER = "http://matonto.org/users/admin";
    private Resource userContext;
    private EncryptionSupport encryptionSupport;
    private Repository repository;
    private ValueFactory factory;
    private ModelFactory modelFactory;
    private UserFactory userFactory;
    private GroupFactory groupFactory;
    private RoleFactory roleFactory;
    private ThingFactory thingFactory;

    @Activate
    public void start(Map<String, Object> props) {
        logger.info("Activating " + COMPONENT_NAME);
        RdfEngineConfig config = Configurable.createConfigurable(RdfEngineConfig.class, props);
        setEncryption(config);
        initUserManagerResources();

        RepositoryConnection conn = repository.getConnection();
        conn.begin();
        if (!resourceExists(factory.createIRI(ADMIN_ROLE))) {
            Role adminRole = roleFactory.createNew(factory.createIRI(ADMIN_ROLE));
            adminRole.setProperty(factory.createLiteral("admin"), factory.createIRI(DCTERMS.TITLE.stringValue()));
            conn.add(adminRole.getModel(), userContext);
        }
        if (!resourceExists(factory.createIRI(USER_ROLE))) {
            Role adminRole = roleFactory.createNew(factory.createIRI(USER_ROLE));
            adminRole.setProperty(factory.createLiteral("user"), factory.createIRI(DCTERMS.TITLE.stringValue()));
            conn.add(adminRole.getModel(), userContext);
        }
        if (!resourceExists(factory.createIRI(ADMIN_USER))) {
            Role adminRole = roleFactory.createNew(factory.createIRI(ADMIN_ROLE));
            Role userRole = roleFactory.createNew(factory.createIRI(USER_ROLE));
            Set<Role> roles = Stream.of(adminRole, userRole).collect(Collectors.toSet());
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
    public void modified(Map<String, Object> props) {
        logger.info("Modifying the " + COMPONENT_NAME);
        RdfEngineConfig config = Configurable.createConfigurable(RdfEngineConfig.class, props);
        setEncryption(config);
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
    protected void setThingFactory(ThingFactory thingFactory) {
        this.thingFactory = thingFactory;
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
    public User createUser(UserConfig userConfig) {
        User user = userFactory.createNew(factory.createIRI("http://matonto.org/users/" + userConfig.getUsername()));
        user.setUsername(factory.createLiteral(userConfig.getUsername()));
        String password = userConfig.getPassword();
        Encryption encryption = encryptionSupport.getEncryption();
        if (encryption != null) {
            password = encryptionSupport.getEncryption().encryptPassword(password);
            if (encryptionSupport.getEncryptionPrefix() != null) {
                password = encryptionSupport.getEncryptionPrefix() + password;
            }
            if (encryptionSupport.getEncryptionSuffix() != null) {
                password = password + encryptionSupport.getEncryptionSuffix();
            }
        }
        user.setPassword(factory.createLiteral(password));
        Set<Role> roles = userConfig.getRoles().stream()
                .map(roleStr -> factory.createIRI("http://matonto.org/roles/" + roleStr))
                .filter(role -> role.equals(factory.createIRI(ADMIN_ROLE)) || role.equals(factory.createIRI(USER_ROLE)))
                .map(role1 -> roleFactory.createNew(role1))
                .collect(Collectors.toSet());
        if (!roles.isEmpty()) {
            user.setHasUserRole(roles);
        }

        if (!userConfig.getEmail().equals("")) {
            Set<Thing> email = new HashSet<>();
            email.add(thingFactory.createNew(factory.createIRI("mailto:" + userConfig.getEmail())));
            user.setMbox(email);
        }
        if (!userConfig.getFirstName().equals("")) {
            Set<Literal> firstName = new HashSet<>();
            firstName.add(factory.createLiteral(userConfig.getFirstName()));
            user.setFirstName(firstName);
        }
        if (!userConfig.getLastName().equals("")) {
            Set<Literal> lastName = new HashSet<>();
            lastName.add(factory.createLiteral(userConfig.getLastName()));
            user.setLastName(lastName);
        }
        return user;
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
    public Group createGroup(GroupConfig groupConfig) {
        Group group = groupFactory.createNew(factory.createIRI("http://matonto.org/groups/" + groupConfig.getTitle()));
        group.setProperty(factory.createLiteral(groupConfig.getTitle()),
                factory.createIRI(DCTERMS.TITLE.stringValue()));

        if (groupConfig.getMembers() != null) {
            Set<Agent> members = groupConfig.getMembers().stream()
                    .map(userStr -> "http://matonto.org/users/" + userStr)
                    .filter(this::userExists)
                    .map(userId -> userFactory.createNew(factory.createIRI(userId)))
                    .collect(Collectors.toSet());
            if (!members.isEmpty()) {
                group.setMember(members);
            }
        }
        if (groupConfig.getRoles() != null) {
            Set<Role> roles = groupConfig.getRoles().stream()
                    .map(roleStr -> factory.createIRI("http://matonto.org/roles/" + roleStr))
                    .filter(role -> role.equals(factory.createIRI(ADMIN_ROLE))
                            || role.equals(factory.createIRI(USER_ROLE)))
                    .map(role1 -> roleFactory.createNew(role1))
                    .collect(Collectors.toSet());
            if (!roles.isEmpty()) {
                group.setHasGroupRole(roles);
            }
        }
        if (!groupConfig.getDescription().equals("")) {
            group.setProperty(factory.createLiteral(groupConfig.getDescription()),
                    factory.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        }
        return group;
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
        if (!userExists(userId)) {
            throw new MatOntoException("User with that id does not exist");
        }
        Optional<User> userOptional = retrieveUser(userId);
        if (!userOptional.isPresent()) {
            throw new MatOntoException("Could not retrieve user");
        }
        User user = userOptional.get();
        if (!user.getPassword().isPresent()) {
            throw new MatOntoException("Error retrieving user info");
        }
        String savedPassword = user.getPassword().get().stringValue();

        Encryption encryption = encryptionSupport.getEncryption();
        if (encryption == null) {
            return savedPassword.equals(password);
        } else {
            String encryptionPrefix = encryptionSupport.getEncryptionPrefix();
            String encryptionSuffix = encryptionSupport.getEncryptionSuffix();
            boolean prefix = encryptionPrefix == null || savedPassword.startsWith(encryptionPrefix);
            boolean suffix = encryptionSuffix == null || savedPassword.endsWith(encryptionSuffix);
            if (prefix && suffix) {
                savedPassword = savedPassword.substring(encryptionPrefix != null ? encryptionPrefix.length() : 0,
                        savedPassword.length() - (encryptionSuffix != null ? encryptionSuffix.length() : 0));
                return encryption.checkPassword(password, savedPassword);
            } else {
                return password.equals(savedPassword);
            }
        }
    }

    private void initUserManagerResources() {
        userContext = factory.createIRI("http://matonto.org/usermanagement");
    }

    private void setEncryption(RdfEngineConfig config) {
        Map<String, Object> options = new HashMap<>();
        options.put("encryption.name", config.encryptionName());
        options.put("encryption.enabled", config.encryptionEnabled());
        options.put("encryption.prefix", config.encryptionPrefix());
        options.put("encryption.suffix", config.encryptionSuffix());
        options.put("encryption.algorithm", config.encryptionAlgorithm());
        options.put("encryption.encoding", config.encryptionEncoding());
        this.encryptionSupport = new EncryptionSupport(options);
    }

    private boolean resourceExists(Resource resource) {
        RepositoryConnection conn = repository.getConnection();
        boolean exists = conn.getStatements(resource, null, null, userContext).hasNext();
        conn.close();
        return exists;
    }
}
