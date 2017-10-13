package com.mobi.jaas.engines;

/*-
 * #%L
 * com.mobi.jaas.engines
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.GroupFactory;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.RoleFactory;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.karaf.jaas.modules.Encryption;
import org.apache.karaf.jaas.modules.encryption.EncryptionSupport;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.ontologies.foaf.Agent;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.impl.ThingFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.repository.exception.RepositoryException;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.model.vocabulary.RDF;
import org.osgi.framework.BundleContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component(
        designateFactory = RdfEngineConfig.class,
        configurationPolicy = ConfigurationPolicy.require,
        properties = {
                "engineName=RdfEngine"
        }
)
public class RdfEngine implements Engine {
    private static final String ENGINE_NAME = "com.mobi.jaas.engines.RdfEngine";
    private static final Logger logger = LoggerFactory.getLogger(RdfEngine.class);

    private Resource context;
    private String userNamespace;
    private String groupNamespace;
    private String roleNamespace;
    private Set<String> roles;
    private EncryptionSupport encryptionSupport;
    private Repository repository;
    private ValueFactory factory;
    private ModelFactory modelFactory;
    private UserFactory userFactory;
    private GroupFactory groupFactory;
    private RoleFactory roleFactory;
    private ThingFactory thingFactory;

    @Activate
    public void start(BundleContext bundleContext, Map<String, Object> props) {
        logger.info("Activating " + getEngineName());
        RdfEngineConfig config = Configurable.createConfigurable(RdfEngineConfig.class, props);
        setEncryption(config, bundleContext);
        roles = Stream.of(config.roles()).collect(Collectors.toSet());
        initEngineResources();

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.begin();
            roles.stream()
                    .filter(role -> !resourceExists(factory.createIRI(roleNamespace + role)))
                    .forEach(role -> {
                        Role adminRole = roleFactory.createNew(factory.createIRI(roleNamespace + role));
                        adminRole.setProperty(factory.createLiteral(role),
                                factory.createIRI(DCTERMS.TITLE.stringValue()));
                        conn.add(adminRole.getModel(), context);
                    });
            Resource adminIRI = createUserIri("admin");
            if (!resourceExists(adminIRI)) {
                Set<Role> allRoles = roles.stream()
                        .map(role -> roleFactory.createNew(factory.createIRI(roleNamespace + role)))
                        .collect(Collectors.toSet());
                User admin = userFactory.createNew(adminIRI);
                admin.setUsername(factory.createLiteral("admin"));
                admin.setPassword(factory.createLiteral(getEncryptedPassword("admin")));
                admin.setHasUserRole(allRoles);
                conn.add(admin.getModel(), context);
            }
            conn.commit();
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    @Modified
    public void modified(BundleContext bundleContext, Map<String, Object> props) {
        logger.info("Modifying the " + getEngineName());
        RdfEngineConfig config = Configurable.createConfigurable(RdfEngineConfig.class, props);
        setEncryption(config, bundleContext);
        initEngineResources();
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
        this.roleFactory = roleFactory;
    }

    @Reference
    protected void setThingFactory(ThingFactory thingFactory) {
        this.thingFactory = thingFactory;
    }

    @Override
    public Optional<Role> getRole(String roleName) {
        if (!roles.contains(roleName)) {
            return Optional.empty();
        }

        Model roleModel = modelFactory.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(factory.createIRI(roleNamespace + roleName),
                    null, null, context);
            statements.forEach(roleModel::add);
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }

        return roleFactory.getExisting(factory.createIRI(roleNamespace + roleName), roleModel);
    }

    @Override
    public Set<User> getUsers() {
        Set<User> users = new HashSet<>();
        try (RepositoryConnection conn = repository.getConnection()) {
            Model usersModel = modelFactory.createModel();
            RepositoryResult<Statement> statements = conn.getStatements(null, null, null, context);
            statements.forEach(usersModel::add);
            users.addAll(userFactory.getAllExisting(usersModel));
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
        return users;
    }

    @Override
    public User createUser(UserConfig userConfig) {
        User user = userFactory.createNew(createUserIri(userConfig.getUsername()));
        user.setUsername(factory.createLiteral(userConfig.getUsername()));
        user.setPassword(factory.createLiteral(getEncryptedPassword(userConfig.getPassword())));
        Set<Role> newRoles = userConfig.getRoles().stream()
                .map(this::getRole)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toSet());
        if (!newRoles.isEmpty()) {
            user.setHasUserRole(newRoles);
        }

        if (!userConfig.getEmail().equals("")) {
            String emailStr = userConfig.getEmail();
            Set<Thing> email = new HashSet<>();
            email.add(thingFactory.createNew(
                    factory.createIRI(emailStr.contains("mailto:") ? emailStr : "mailto:" + emailStr)));
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
    public void storeUser(User user) {
        Literal username = user.getUsername().orElseThrow(() -> new MobiException("User must have a username"));
        if (resourceExists(user.getResource()) || userExists(username.stringValue())) {
            throw new MobiException("User with that id already exists");
        }

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(user.getModel(), context);
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    @Override
    public boolean userExists(String username) {
        return resourceExists(createUserIri(username), User.TYPE);
    }

    @Override
    public Optional<User> retrieveUser(String username) {
        if (!userExists(username)) {
            return Optional.empty();
        }

        Model userModel = modelFactory.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(createUserIri(username),
                    null, null, context);
            statements.forEach(userModel::add);
            roles.stream()
                    .map(this::getRole)
                    .forEach(roleOptional -> roleOptional.ifPresent(role -> userModel.addAll(role.getModel())));
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
        return userFactory.getExisting(createUserIri(username), userModel);
    }

    @Override
    public void updateUser(User newUser) {
        if (!resourceExists(newUser.getResource())) {
            throw new MobiException("User with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(newUser.getResource(), null, null, context);
            conn.add(newUser.getModel(), context);
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    @Override
    public void deleteUser(String username) {
        if (!userExists(username)) {
            throw new MobiException("User with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(createUserIri(username), null, null, context);
            conn.remove(null, null, (Value) createUserIri(username), context);
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    @Override
    public Set<Group> getGroups() {
        Set<Group> groups = new HashSet<>();
        try (RepositoryConnection conn = repository.getConnection()) {
            Model groupsModel = modelFactory.createModel();
            RepositoryResult<Statement> statements = conn.getStatements(null, null, null, context);
            statements.forEach(groupsModel::add);
            groups.addAll(groupFactory.getAllExisting(groupsModel));
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
        return groups;
    }

    @Override
    public Group createGroup(GroupConfig groupConfig) {
        Group group = groupFactory.createNew(createGroupIri(groupConfig.getTitle()));
        group.setProperty(factory.createLiteral(groupConfig.getTitle()),
                factory.createIRI(DCTERMS.TITLE.stringValue()));

        if (groupConfig.getMembers() != null) {
            Set<Agent> members = groupConfig.getMembers().stream()
                    .filter(this::userExists)
                    .map(username -> userFactory.createNew(createUserIri(username)))
                    .collect(Collectors.toSet());
            if (!members.isEmpty()) {
                group.setMember(members);
            }
        }
        if (groupConfig.getRoles() != null) {
            Set<Role> newRoles = groupConfig.getRoles().stream()
                    .map(this::getRole)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toSet());
            if (!newRoles.isEmpty()) {
                group.setHasGroupRole(newRoles);
            }
        }
        if (!groupConfig.getDescription().equals("")) {
            group.setProperty(factory.createLiteral(groupConfig.getDescription()),
                    factory.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        }
        return group;
    }

    @Override
    public void storeGroup(Group group) {
        Value title = group.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue())).orElseThrow(() ->
                new MobiException("Group must have a title"));
        if (resourceExists(group.getResource()) || groupExists(title.stringValue())) {
            throw new MobiException("Group with that id already exists");
        }

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(group.getModel(), context);
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    @Override
    public boolean groupExists(String groupTitle) {
        return resourceExists(createGroupIri(groupTitle), Group.TYPE);
    }

    @Override
    public Optional<Group> retrieveGroup(String groupTitle) {
        if (!groupExists(groupTitle)) {
            return Optional.empty();
        }

        Model groupModel = modelFactory.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(createGroupIri(groupTitle),
                    null, null, context);
            statements.forEach(groupModel::add);
            roles.stream()
                    .map(this::getRole)
                    .forEach(roleOptional -> roleOptional.ifPresent(role -> groupModel.addAll(role.getModel())));
            groupModel.filter(createGroupIri(groupTitle), factory.createIRI(Group.member_IRI), null)
                    .objects().forEach(userIRI -> {
                        RepositoryResult<Statement> userStatements = conn.getStatements((Resource) userIRI, null, null,
                                context);
                        userStatements.forEach(groupModel::add);
                    });
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
        return groupFactory.getExisting(createGroupIri(groupTitle), groupModel);
    }

    @Override
    public void updateGroup(Group newGroup) {
        if (!resourceExists(newGroup.getResource())) {
            throw new MobiException("Group with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(newGroup.getResource(), null, null, context);
            conn.add(newGroup.getModel(), context);
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    @Override
    public void deleteGroup(String groupTitle) {
        if (!groupExists(groupTitle)) {
            throw new MobiException("Group with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(createGroupIri(groupTitle), null, null, context);
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    @Override
    public Set<Role> getUserRoles(String username) {
        TreeSet<Role> allRoles = new TreeSet<>(Comparator.comparing(role -> role.getResource().stringValue()));
        Optional<User> userOptional = retrieveUser(username);
        if (!userOptional.isPresent()) {
            throw new MobiException("User with that id does not exist");
        }
        allRoles.addAll(userOptional.get().getHasUserRole());
        getGroups().stream()
                .filter(group -> group.getMember().stream()
                        .map(Thing::getResource)
                        .anyMatch(resource -> resource.equals(createUserIri(username))))
                .map(Group::getHasGroupRole)
                .flatMap(Collection::stream)
                .forEach(allRoles::add);

        return allRoles;
    }

    @Override
    public boolean checkPassword(String username, String password) {
        Optional<User> userOptional = retrieveUser(username);
        if (!userOptional.isPresent()) {
            throw new MobiException("User with that id does not exist");
        }
        User user = userOptional.get();
        if (!user.getPassword().isPresent()) {
            throw new MobiException("Error retrieving user info");
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

    @Override
    public String getEngineName() {
        return ENGINE_NAME;
    }

    private String getEncryptedPassword(String password) {
        Encryption encryption = encryptionSupport.getEncryption();
        String encryptionPrefix = encryptionSupport.getEncryptionPrefix();
        String encryptionSuffix = encryptionSupport.getEncryptionSuffix();

        if (encryption == null) {
            return password;
        } else {
            boolean prefix = encryptionPrefix == null || password.startsWith(encryptionPrefix);
            boolean suffix = encryptionSuffix == null || password.endsWith(encryptionSuffix);
            if (prefix && suffix) {
                return password;
            } else {
                String encryptPassword = encryption.encryptPassword(password);
                if (encryptionPrefix != null) {
                    encryptPassword = encryptionPrefix + encryptPassword;
                }
                if (encryptionSuffix != null) {
                    encryptPassword += encryptionSuffix;
                }
                return encryptPassword;
            }
        }
    }

    private void initEngineResources() {
        context = factory.createIRI("http://mobi.com/usermanagement");
        userNamespace = "http://mobi.com/users/";
        groupNamespace = "http://mobi.com/groups/";
        roleNamespace = "http://mobi.com/roles/";
    }

    private void setEncryption(RdfEngineConfig config, BundleContext context) {
        Map<String, Object> options = new HashMap<>();
        options.put(BundleContext.class.getName(), context);
        options.put("encryption.name", config.encryptionName());
        options.put("encryption.enabled", config.encryptionEnabled());
        options.put("encryption.prefix", config.encryptionPrefix());
        options.put("encryption.suffix", config.encryptionSuffix());
        options.put("encryption.algorithm", config.encryptionAlgorithm());
        options.put("encryption.encoding", config.encryptionEncoding());
        this.encryptionSupport = new EncryptionSupport(options);
    }

    private boolean resourceExists(Resource resource) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return conn.getStatements(resource, null, null, context).hasNext();
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    private boolean resourceExists(Resource resource, String typeString) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return conn.getStatements(resource, factory.createIRI(RDF.TYPE.stringValue()),
                    factory.createIRI(typeString), context).hasNext();
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    private Resource createUserIri(String username) {
        return factory.createIRI(userNamespace + DigestUtils.sha1Hex(username));
    }

    private Resource createGroupIri(String groupTitle) {
        return factory.createIRI(groupNamespace + DigestUtils.sha1Hex(groupTitle));
    }
}
