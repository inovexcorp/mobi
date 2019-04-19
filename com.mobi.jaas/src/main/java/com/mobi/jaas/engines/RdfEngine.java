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
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.ExternalGroup;
import com.mobi.jaas.api.ontologies.usermanagement.ExternalUser;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.GroupFactory;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.RoleFactory;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.ontologies.foaf.Agent;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.query.api.GraphQuery;
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
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.IOUtils;
import org.apache.karaf.jaas.modules.Encryption;
import org.apache.karaf.jaas.modules.encryption.EncryptionSupport;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.osgi.framework.BundleContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
    public static final String ENGINE_NAME = "com.mobi.jaas.engines.RdfEngine";
    private static final Logger logger = LoggerFactory.getLogger(RdfEngine.class);

    private Resource context;
    private String userNamespace;
    private String groupNamespace;
    private String roleNamespace;
    private Set<String> roles;
    private EncryptionSupport encryptionSupport;
    private Repository repository;
    private ValueFactory vf;
    private ModelFactory mf;
    private UserFactory userFactory;
    private GroupFactory groupFactory;
    private RoleFactory roleFactory;
    private ThingFactory thingFactory;

    private static final String GET_USERS_QUERY;
    private static final String GET_GROUPS_QUERY;
    private static final String GET_USER_ROLES_QUERY;
    private static final String USER_BINDING = "userId";

    static {
        try {
            GET_USERS_QUERY = IOUtils.toString(
                    RdfEngine.class.getResourceAsStream("/get_users.rq"),
                    "UTF-8"
            );
            GET_GROUPS_QUERY = IOUtils.toString(
                    RdfEngine.class.getResourceAsStream("/get_groups.rq"),
                    "UTF-8"
            );
            GET_USER_ROLES_QUERY = IOUtils.toString(
                    RdfEngine.class.getResourceAsStream("/get_user_roles.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Activate
    void start(BundleContext bundleContext, Map<String, Object> props) {
        logger.info("Activating " + getEngineName());
        RdfEngineConfig config = Configurable.createConfigurable(RdfEngineConfig.class, props);
        setEncryption(config, bundleContext);
        roles = Stream.of(config.roles()).collect(Collectors.toSet());
        initEngineResources();

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.begin();
            roles.stream()
                    .filter(role -> !resourceExists(vf.createIRI(roleNamespace + role)))
                    .forEach(role -> {
                        Role adminRole = roleFactory.createNew(vf.createIRI(roleNamespace + role));
                        adminRole.setProperty(vf.createLiteral(role),
                                vf.createIRI(DCTERMS.TITLE.stringValue()));
                        conn.add(adminRole.getModel(), context);
                    });
            Resource adminIRI = createUserIri("admin");
            if (!resourceExists(adminIRI)) {
                Set<Role> allRoles = roles.stream()
                        .map(role -> roleFactory.createNew(vf.createIRI(roleNamespace + role)))
                        .collect(Collectors.toSet());
                User admin = userFactory.createNew(adminIRI);
                admin.setUsername(vf.createLiteral("admin"));
                admin.setPassword(vf.createLiteral(getEncryptedPassword("admin")));
                admin.setHasUserRole(allRoles);
                conn.add(admin.getModel(), context);
            }
            conn.commit();
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    @Modified
    void modified(BundleContext bundleContext, Map<String, Object> props) {
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
        this.vf = vf;
    }

    @Reference
    protected void setModelFactory(final ModelFactory mf) {
        this.mf = mf;
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

        Model roleModel = mf.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(vf.createIRI(roleNamespace + roleName),
                    null, null, context);
            statements.forEach(roleModel::add);
        }

        return roleFactory.getExisting(vf.createIRI(roleNamespace + roleName), roleModel);
    }

    @Override
    public Set<User> getUsers() {
        Set<User> users = new HashSet<>();
        try (RepositoryConnection conn = repository.getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_USERS_QUERY);
            Model usersModel = QueryResults.asModel(query.evaluate(), mf);
            users.addAll(userFactory.getAllExisting(usersModel));
        }
        return users;
    }

    @Override
    public User createUser(UserConfig userConfig) {
        User user = userFactory.createNew(createUserIri(userConfig.getUsername()));
        user.setUsername(vf.createLiteral(userConfig.getUsername()));
        user.setPassword(vf.createLiteral(getEncryptedPassword(userConfig.getPassword())));
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
                    vf.createIRI(emailStr.contains("mailto:") ? emailStr : "mailto:" + emailStr)));
            user.setMbox(email);
        }
        if (!userConfig.getFirstName().equals("")) {
            Set<Literal> firstName = new HashSet<>();
            firstName.add(vf.createLiteral(userConfig.getFirstName()));
            user.setFirstName(firstName);
        }
        if (!userConfig.getLastName().equals("")) {
            Set<Literal> lastName = new HashSet<>();
            lastName.add(vf.createLiteral(userConfig.getLastName()));
            user.setLastName(lastName);
        }
        return user;
    }

    @Override
    public void storeUser(User user) {
        Literal username = user.getUsername().orElseThrow(() ->
                new IllegalArgumentException("User must have a username"));
        if (resourceExists(user.getResource()) || userExists(username.stringValue())) {
            throw new IllegalArgumentException("User with that id already exists");
        }

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(user.getModel(), context);
        }
    }

    @Override
    public boolean userExists(String username) {
        return userExists(createUserIri(username));
    }

    @Override
    public boolean userExists(Resource userId) {
        return resourceExists(userId, User.TYPE) && !resourceExists(userId, ExternalUser.TYPE);
    }

    @Override
    public Optional<User> retrieveUser(String username) {
        if (!userExists(username)) {
            return Optional.empty();
        }

        Model userModel = mf.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(createUserIri(username),
                    null, null, context);
            statements.forEach(userModel::add);
            roles.stream()
                    .map(this::getRole)
                    .forEach(roleOptional -> roleOptional.ifPresent(role -> userModel.addAll(role.getModel())));
        }
        return userFactory.getExisting(createUserIri(username), userModel);
    }

    @Override
    public void updateUser(User newUser) {
        if (!userExists(newUser.getResource())) {
            throw new IllegalArgumentException("User with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(newUser.getResource(), null, null, context);
            conn.add(newUser.getModel(), context);
        }
    }

    @Override
    public void deleteUser(String username) {
        if (!userExists(username)) {
            throw new IllegalArgumentException("User with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(createUserIri(username), null, null, context);
            conn.remove(null, null, (Value) createUserIri(username), context);
        }
    }

    @Override
    public Set<Group> getGroups() {
        Set<Group> groups = new HashSet<>();
        try (RepositoryConnection conn = repository.getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_GROUPS_QUERY);
            Model groupsModel = QueryResults.asModel(query.evaluate(), mf);
            groups.addAll(groupFactory.getAllExisting(groupsModel));
        }
        return groups;
    }

    @Override
    public Group createGroup(GroupConfig groupConfig) {
        Group group = groupFactory.createNew(createGroupIri(groupConfig.getTitle()));
        group.setProperty(vf.createLiteral(groupConfig.getTitle()),
                vf.createIRI(DCTERMS.TITLE.stringValue()));

        if (groupConfig.getMembers() != null) {
            Set<Agent> members = new HashSet<>(groupConfig.getMembers());
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
            group.setProperty(vf.createLiteral(groupConfig.getDescription()),
                    vf.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        }
        return group;
    }

    @Override
    public void storeGroup(Group group) {
        Value title = group.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue())).orElseThrow(() ->
                new IllegalArgumentException("Group must have a title"));
        if (resourceExists(group.getResource()) || groupExists(title.stringValue())) {
            throw new IllegalArgumentException("Group with that id already exists");
        }

        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(group.getModel(), context);
        }
    }

    @Override
    public boolean groupExists(String groupTitle) {
        return groupExists(createGroupIri(groupTitle));
    }

    @Override
    public boolean groupExists(Resource groupId) {
        return resourceExists(groupId, Group.TYPE) && !resourceExists(groupId, ExternalGroup.TYPE);
    }

    @Override
    public Optional<Group> retrieveGroup(String groupTitle) {
        if (!groupExists(groupTitle)) {
            return Optional.empty();
        }

        Model groupModel = mf.createModel();
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(createGroupIri(groupTitle),
                    null, null, context);
            statements.forEach(groupModel::add);
            roles.stream()
                    .map(this::getRole)
                    .forEach(roleOptional -> roleOptional.ifPresent(role -> groupModel.addAll(role.getModel())));
            groupModel.filter(createGroupIri(groupTitle), vf.createIRI(Group.member_IRI), null)
                    .objects().forEach(userIRI -> {
                        RepositoryResult<Statement> userStatements = conn.getStatements((Resource) userIRI, null, null,
                                context);
                        userStatements.forEach(groupModel::add);
                    });
        }
        return groupFactory.getExisting(createGroupIri(groupTitle), groupModel);
    }

    @Override
    public void updateGroup(Group newGroup) {
        if (!groupExists(newGroup.getResource())) {
            throw new IllegalArgumentException("Group with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(newGroup.getResource(), null, null, context);
            conn.add(newGroup.getModel(), context);
        }
    }

    @Override
    public void deleteGroup(String groupTitle) {
        if (!groupExists(groupTitle)) {
            throw new IllegalArgumentException("Group with that id does not exist");
        }
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.remove(createGroupIri(groupTitle), null, null, context);
        }
    }

    @Override
    public Set<Role> getUserRoles(String username) {
        Optional<User> userOptional = retrieveUser(username);
        if (!userOptional.isPresent()) {
            throw new IllegalArgumentException("User with that id does not exist");
        }
        Set<Role> roles = new HashSet<>();
        try (RepositoryConnection conn = repository.getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_USER_ROLES_QUERY);
            query.setBinding(USER_BINDING, userOptional.get().getResource());
            Model rolesModel = QueryResults.asModel(query.evaluate(), mf);
            roles.addAll(roleFactory.getAllExisting(rolesModel));
            return roles;
        }
    }

    @Override
    public boolean checkPassword(String username, String password) {
        Optional<User> userOptional = retrieveUser(username);
        if (!userOptional.isPresent()) {
            throw new IllegalArgumentException("User with that id does not exist");
        }
        User user = userOptional.get();
        if (!user.getPassword().isPresent()) {
            throw new IllegalStateException("Error retrieving user info");
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
        context = vf.createIRI("http://mobi.com/usermanagement");
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
            return conn.getStatements(resource, vf.createIRI(RDF.TYPE.stringValue()),
                    vf.createIRI(typeString), context).hasNext();
        } catch (RepositoryException e) {
            throw new MobiException("Error in repository connection", e);
        }
    }

    private Resource createUserIri(String username) {
        return vf.createIRI(userNamespace + DigestUtils.sha1Hex(username));
    }

    private Resource createGroupIri(String groupTitle) {
        return vf.createIRI(groupNamespace + DigestUtils.sha1Hex(groupTitle));
    }
}
