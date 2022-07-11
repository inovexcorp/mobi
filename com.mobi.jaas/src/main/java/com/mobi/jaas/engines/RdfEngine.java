package com.mobi.jaas.engines;

/*-
 * #%L
 * com.mobi.jaas.engines
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
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.impl.ThingFactory;
import com.mobi.repository.api.OsgiRepository;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.IOUtils;
import org.apache.karaf.jaas.modules.Encryption;
import org.apache.karaf.jaas.modules.encryption.EncryptionSupport;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.SimpleValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component(
        configurationPolicy = ConfigurationPolicy.REQUIRE,
        property = {
                "engineName=RdfEngine"
        }
)
@Designate(ocd = RdfEngineConfig.class)
public class RdfEngine implements Engine {
    public static final String ENGINE_NAME = "com.mobi.jaas.engines.RdfEngine";
    private static final Logger logger = LoggerFactory.getLogger(RdfEngine.class);

    private final ValueFactory vf = SimpleValueFactory.getInstance();
    private final ModelFactory mf = new DynamicModelFactory();

    private Resource context;
    private String userNamespace;
    private String groupNamespace;
    private String roleNamespace;
    private Set<String> roles;
    private EncryptionSupport encryptionSupport;
    private OsgiRepository repository;
    private UserFactory userFactory;
    private GroupFactory groupFactory;
    private RoleFactory roleFactory;
    private ThingFactory thingFactory;

    private static final String GET_USERS_QUERY;
    private static final String GET_GROUPS_QUERY;
    private static final String GET_USER_ROLES_QUERY;
    private static final String GET_USER_IRI;
    private static final String GET_GROUP_IRI;
    private static final String USER_BINDING = "userId";
    private static final String GROUP_BINDING = "groupId";
    private static final String QUERY_USERNAME_BINDING = "queryUsername";
    private static final String QUERY_TITLE_BINDING = "queryTitle";

    static {
        try {
            GET_USERS_QUERY = IOUtils.toString(
                    RdfEngine.class.getResourceAsStream("/get_users.rq"),
                    StandardCharsets.UTF_8
            );
            GET_GROUPS_QUERY = IOUtils.toString(
                    RdfEngine.class.getResourceAsStream("/get_groups.rq"),
                    StandardCharsets.UTF_8
            );
            GET_USER_ROLES_QUERY = IOUtils.toString(
                    RdfEngine.class.getResourceAsStream("/get_user_roles.rq"),
                    StandardCharsets.UTF_8
            );
            GET_USER_IRI = IOUtils.toString(
                    RdfEngine.class.getResourceAsStream("/get_user_iri.rq"),
                    StandardCharsets.UTF_8
            );
            GET_GROUP_IRI = IOUtils.toString(
                    RdfEngine.class.getResourceAsStream("/get_group_iri.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Activate
    void start(BundleContext bundleContext, RdfEngineConfig config) {
        logger.info("Activating " + getEngineName());
        setEncryption(config, bundleContext);
        roles = new HashSet<>(Arrays.asList(config.roles().split(",")));
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
            if (getUserId("admin").isEmpty()) {
                Resource adminIRI = createUserIri("admin");
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
    void modified(BundleContext bundleContext, RdfEngineConfig config) {
        logger.info("Modifying the " + getEngineName());
        setEncryption(config, bundleContext);
        initEngineResources();
    }

    @Reference(target = "(id=system)")
    protected void setOsgiRepository(OsgiRepository repository) {
        this.repository = repository;
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

        Model roleModel = mf.createEmptyModel();
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
        return getUserId(username).isPresent();
    }

    @Override
    public boolean userExists(Resource userId) {
        return resourceExists(userId, User.TYPE) && !resourceExists(userId, ExternalUser.TYPE);
    }

    @Override
    public Optional<User> retrieveUser(String username) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Optional<Resource> optId = getUserId(username, conn);
            if (!optId.isPresent()) {
                return Optional.empty();
            }

            Model userModel = mf.createEmptyModel();
            RepositoryResult<Statement> statements = conn.getStatements(optId.get(), null, null, context);
            statements.forEach(userModel::add);
            roles.stream()
                    .map(this::getRole)
                    .forEach(roleOptional -> roleOptional.ifPresent(role -> userModel.addAll(role.getModel())));

            return userFactory.getExisting(optId.get(), userModel);
        }
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
        try (RepositoryConnection conn = repository.getConnection()) {
            Optional<Resource> optId = getUserId(username, conn);
            if (!optId.isPresent()) {
                throw new IllegalArgumentException("User with that id does not exist");
            }
            conn.remove(optId.get(), null, null, context);
            conn.remove(null, null, (Value) optId.get(), context);
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
        return getGroupId(groupTitle).isPresent();
    }

    @Override
    public boolean groupExists(Resource groupId) {
        return resourceExists(groupId, Group.TYPE) && !resourceExists(groupId, ExternalGroup.TYPE);
    }

    @Override
    public Optional<Group> retrieveGroup(String groupTitle) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Optional<Resource> optId = getGroupId(groupTitle, conn);
            if (!optId.isPresent()) {
                return Optional.empty();
            }

            Model groupModel = mf.createEmptyModel();
            RepositoryResult<Statement> statements = conn.getStatements(optId.get(), null, null, context);
            statements.forEach(groupModel::add);
            roles.stream()
                    .map(this::getRole)
                    .forEach(roleOptional -> roleOptional.ifPresent(role -> groupModel.addAll(role.getModel())));
            groupModel.filter(optId.get(), vf.createIRI(Group.member_IRI), null)
                    .objects().forEach(userIRI -> {
                        RepositoryResult<Statement> userStatements = conn.getStatements((Resource) userIRI, null, null,
                                context);
                        userStatements.forEach(groupModel::add);
                    });
            return groupFactory.getExisting(optId.get(), groupModel);
        }
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
        try (RepositoryConnection conn = repository.getConnection()) {
            Optional<Resource> optId = getGroupId(groupTitle, conn);
            if (!optId.isPresent()) {
                throw new IllegalArgumentException("Group with that id does not exist");
            }
            conn.remove(optId.get(), null, null, context);
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
            logger.debug("User with " + username + " username does not exist");
            return false;
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
        options.put("encryption.name", config.encryption_name());
        options.put("encryption.enabled", config.encryption_enabled());
        options.put("encryption.prefix", config.encryption_prefix());
        options.put("encryption.suffix", config.encryption_suffix());
        options.put("encryption.algorithm", config.encryption_algorithm());
        options.put("encryption.encoding", config.encryption_encoding());
        this.encryptionSupport = new EncryptionSupport(options);
    }

    private boolean resourceExists(Resource resource) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return ConnectionUtils.contains(conn, resource, null, null, context);
        }
    }

    private boolean resourceExists(Resource resource, String typeString) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return ConnectionUtils.contains(conn, resource, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(typeString), context);
        }
    }

    private Resource createUserIri(String username) {
        return vf.createIRI(userNamespace + DigestUtils.sha1Hex(username));
    }

    private Resource createGroupIri(String groupTitle) {
        return vf.createIRI(groupNamespace + DigestUtils.sha1Hex(groupTitle));
    }

    private Optional<Resource> getUserId(String username) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return getUserId(username, conn);
        }
    }

    private Optional<Resource> getUserId(String username, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_USER_IRI);
        query.setBinding(QUERY_USERNAME_BINDING, vf.createLiteral(username));
        TupleQueryResult result = query.evaluate();
        if (!result.hasNext()) {
            return Optional.empty();
        }
        BindingSet bindingSet = result.next();
        result.close();
        return Optional.of(Bindings.requiredResource(bindingSet, USER_BINDING));
    }

    private Optional<Resource> getGroupId(String groupTitle) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return getGroupId(groupTitle, conn);
        }
    }

    private Optional<Resource> getGroupId(String groupTitle, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_GROUP_IRI);
        query.setBinding(QUERY_TITLE_BINDING, vf.createLiteral(groupTitle));
        TupleQueryResult result = query.evaluate();
        if (!result.hasNext()) {
            return Optional.empty();
        }
        BindingSet bindingSet = result.next();
        result.close();
        return Optional.of(Bindings.requiredResource(bindingSet, GROUP_BINDING));
    }
}
