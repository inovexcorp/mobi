package com.mobi.jaas.engines;

/*-
 * #%L
 * com.mobi.jaas
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.ExternalGroup;
import com.mobi.jaas.api.ontologies.usermanagement.ExternalUser;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.foaf.Agent;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.karaf.jaas.modules.Encryption;
import org.apache.karaf.jaas.modules.encryption.EncryptionSupport;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.BundleContext;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class RdfEngineTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private RdfEngine engine;
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<ExternalUser> externalUserFactory = getRequiredOrmFactory(ExternalUser.class);
    private OrmFactory<Group> groupFactory = getRequiredOrmFactory(Group.class);
    private OrmFactory<ExternalGroup> externalGroupFactory = getRequiredOrmFactory(ExternalGroup.class);

    private String username = "tester";
    private String userId = "http://mobi.com/users/" + DigestUtils.sha1Hex(username);
    private String externalUsername = "externaluser";
    private String externalUserId = "http://mobi.com/users/" + DigestUtils.sha1Hex(externalUsername);
    private String password = "test";
    private String groupName1 = "cats";
    private String groupId1 = "http://mobi.com/groups/" + DigestUtils.sha1Hex(groupName1);
    private String groupName2 = "dogs";
    private String groupId2 = "http://mobi.com/groups/" + DigestUtils.sha1Hex(groupName2);
    private String externalGroupName = "externalgroup";
    private String externalGroupId = "http://mobi.com/groups/" + DigestUtils.sha1Hex(externalGroupName);
    private String userRoleId = "http://mobi.com/roles/user";
    private String adminRoleId = "http://mobi.com/roles/admin";
    private boolean setUp = false;

    @Mock
    private BundleContext bundleContext;

    @Mock
    private Encryption encryption;

    @Mock
    private EncryptionSupport encryptionSupport;

    @Mock
    private RdfEngineConfig rdfEngineConfig;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        
        engine = new RdfEngine();
        injectOrmFactoryReferencesIntoService(engine);
        engine.setOsgiRepository(repo);

        if (!setUp) {
            OrmFactory<Role> roleFactory = getRequiredOrmFactory(Role.class);

            Role userRole = roleFactory.createNew(VALUE_FACTORY.createIRI(userRoleId));
            Role adminRole = roleFactory.createNew(VALUE_FACTORY.createIRI(adminRoleId));
            Set<Role> roles = Stream.of(userRole).collect(Collectors.toSet());
            User testUser = userFactory.createNew(VALUE_FACTORY.createIRI(userId));
            testUser.setUsername(VALUE_FACTORY.createLiteral(username));
            testUser.setPassword(VALUE_FACTORY.createLiteral(password));
            testUser.setHasUserRole(roles);
            User externalUser = externalUserFactory.createNew(VALUE_FACTORY.createIRI(externalUserId));
            externalUser.setUsername(VALUE_FACTORY.createLiteral(externalUsername));
            roles.add(adminRole);
            Set<Agent> members = Stream.of(testUser).collect(Collectors.toSet());
            Group testGroup1 = groupFactory.createNew(VALUE_FACTORY.createIRI(groupId1));
            Group testGroup2 = groupFactory.createNew(VALUE_FACTORY.createIRI(groupId2));
            Group externalGroup = externalGroupFactory.createNew(VALUE_FACTORY.createIRI(externalGroupId));
            testGroup1.setProperty(VALUE_FACTORY.createLiteral(groupName1), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()));
            testGroup2.setProperty(VALUE_FACTORY.createLiteral(groupName2), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()));
            testGroup1.setHasGroupRole(roles);
            testGroup2.setHasGroupRole(Collections.singleton(roleFactory.createNew(VALUE_FACTORY.createIRI(adminRoleId))));
            testGroup1.setMember(members);
            testGroup2.setMember(members);
            RepositoryConnection conn = repo.getConnection();
            String context = "http://mobi.com/usermanagement";
            conn.add(testUser.getModel(), VALUE_FACTORY.createIRI(context));
            conn.add(externalUser.getModel(), VALUE_FACTORY.createIRI(context));
            conn.add(testGroup1.getModel(), VALUE_FACTORY.createIRI(context));
            conn.add(testGroup2.getModel(), VALUE_FACTORY.createIRI(context));
            conn.add(externalGroup.getModel(), VALUE_FACTORY.createIRI(context));
            conn.close();
            setUp = true;
        }

        when(encryptionSupport.getEncryption()).thenReturn(encryption);
        when(encryptionSupport.getEncryptionPrefix()).thenReturn("");
        when(encryptionSupport.getEncryptionSuffix()).thenReturn("");
        when(encryption.checkPassword(anyString(), anyString())).thenReturn(true);
        when(encryption.encryptPassword(anyString())).thenAnswer(i -> i.getArgument(0, String.class));

        when(rdfEngineConfig.roles()).thenReturn("admin,user");
        when(rdfEngineConfig.encryption_enabled()).thenReturn(false);
        when(rdfEngineConfig.encryption_name()).thenReturn("basic");
        when(rdfEngineConfig.encryption_prefix()).thenReturn("{CRYPT}");
        when(rdfEngineConfig.encryption_suffix()).thenReturn("{CRYPT}");
        when(rdfEngineConfig.encryption_algorithm()).thenReturn("MD5");
        when(rdfEngineConfig.encryption_encoding()).thenReturn("hexadecimal");

        engine.start(bundleContext, rdfEngineConfig);
    }

    @After
    public void tearDown() throws Exception {
        closeable.close();
        repo.shutDown();
    }

    @Test
    public void testGetRole() {
        Optional<Role> roleOptional = engine.getRole("user");

        assertTrue(roleOptional.isPresent());
        Role role = roleOptional.get();
        assertEquals(role.getResource(), (VALUE_FACTORY.createIRI(userRoleId)));
    }

    @Test
    public void testGetRoleThatDoesNotExist() {
        Optional<Role> roleOptional = engine.getRole("error");
        assertFalse(roleOptional.isPresent());
    }

    @Test
    public void testGetUsers() {
        // Setup:
        Set<String> expectedUsernames = Stream.of("admin", username).collect(Collectors.toSet());

        Set<User> users = engine.getUsers();
        assertEquals(expectedUsernames.size(), users.size());
        users.forEach(user -> {
            Optional<Literal> optUsername = user.getUsername();
            assertTrue(optUsername.isPresent());
            assertTrue(expectedUsernames.contains(optUsername.get().stringValue()));
        });
    }

    @Test
    public void testCreateUser() {
        Set<String> roles = Stream.of("user").collect(Collectors.toSet());
        UserConfig config = new UserConfig.Builder(username, password, roles).email("example@example.com")
                .firstName("John").lastName("Doe").build();
        User user = engine.createUser(config);

        assertEquals(user.getResource().stringValue(), userId);
        assertTrue(user.getUsername().isPresent() && user.getUsername().get().stringValue().equals(username));
        assertTrue(user.getPassword().isPresent() && user.getPassword().get().stringValue().equals(password));
        assertEquals(user.getHasUserRole_resource().size(), roles.size());
        assertEquals(1, user.getMbox_resource().size());
        assertTrue(user.getMbox_resource().stream().map(Value::stringValue).collect(Collectors.toSet()).contains("mailto:example@example.com"));
        assertEquals(1, user.getFirstName().size());
        assertTrue(user.getFirstName().stream().map(Value::stringValue).collect(Collectors.toSet()).contains("John"));
        assertEquals(1, user.getLastName().size());
        assertTrue(user.getLastName().stream().map(Value::stringValue).collect(Collectors.toSet()).contains("Doe"));
    }

    @Test
    public void testStoreUser() {
        Resource newUserId = VALUE_FACTORY.createIRI("http://mobi.com/users/newuser");
        User newUser = userFactory.createNew(newUserId);
        newUser.setUsername(VALUE_FACTORY.createLiteral("newuser"));
        engine.storeUser(newUser);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(newUserId, null, null);
        assertTrue(statements.hasNext());
        statements.close();
        connection.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void testStoreUserWithNoUsername() {
        Resource newUserId = VALUE_FACTORY.createIRI("http://mobi.com/users/newuser");
        User newUser = userFactory.createNew(newUserId);
        engine.storeUser(newUser);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testStoreUserThatAlreadyExists() {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI(userId));
        engine.storeUser(user);
    }

    @Test
    public void testUserExists() {
        boolean result = engine.userExists(username);
        assertTrue(result);

        result = engine.userExists("http://mobi.com/users/error");
        assertFalse(result);
    }

    @Test
    public void testUserExistsWithResource() {
        boolean result = engine.userExists(VALUE_FACTORY.createIRI(userId));
        assertTrue(result);

        result = engine.userExists(VALUE_FACTORY.createIRI("http://mobi.com/users/error"));
        assertFalse(result);
    }

    @Test
    public void testRetrieveUser() {
        Optional<User> userOptional = engine.retrieveUser(username);

        assertTrue(userOptional.isPresent());
        User user = userOptional.get();
        assertEquals(user.getResource().stringValue(), userId);
        assertTrue(user.getPassword().isPresent());
        assertEquals(user.getPassword().get().stringValue(), password);
    }

    @Test
    public void testRetrieveUserThatDoesNotExist() {
        Optional<User> userOptional = engine.retrieveUser("http://mobi.com/users/error");
        assertFalse(userOptional.isPresent());
    }

    @Test
    public void testUpdateUser() {
        User newUser = userFactory.createNew(VALUE_FACTORY.createIRI(userId));
        newUser.setPassword(VALUE_FACTORY.createLiteral("123"));
        newUser.setUsername(VALUE_FACTORY.createLiteral("user"));
        engine.updateUser(newUser);
        Model userModel = MODEL_FACTORY.createEmptyModel();
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(VALUE_FACTORY.createIRI(userId), null, null);
        statements.forEach(userModel::add);
        connection.close();
        assertFalse(userModel.isEmpty());
        Optional<User> optUser = userFactory.getExisting(VALUE_FACTORY.createIRI(userId), userModel);
        assertTrue(optUser.isPresent());
        User savedUser = optUser.get();
        assertTrue(savedUser.getPassword().isPresent() && savedUser.getPassword().get().stringValue().equals("123"));
        assertTrue(savedUser.getUsername().isPresent() && savedUser.getUsername().get().stringValue().equals("user"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateUserThatDoesNotExist() {
        User newUser = userFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/users/error"));
        engine.updateUser(newUser);
    }

    @Test
    public void testDeleteUser() {
        engine.deleteUser(username);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(VALUE_FACTORY.createIRI(userId), null, null);
        assertFalse(statements.hasNext());
        statements.close();
        statements = connection.getStatements(null, null, VALUE_FACTORY.createIRI(userId));
        assertFalse(statements.hasNext());
        statements.close();
        connection.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void testDeleteUserThatDoesNotExist() {
        engine.deleteUser("http://mobi.com/users/error");
    }

    @Test
    public void testGetGroups() {
        // Setup:
        Set<String> expectedGroups = Stream.of(groupId1, groupId2).collect(Collectors.toSet());

        Set<Group> groups = engine.getGroups();
        assertEquals(expectedGroups.size(), groups.size());
        groups.forEach(group -> assertTrue(expectedGroups.contains(group.getResource().stringValue())));
    }

    @Test
    public void testCreateGroup() {
        Set<User> members = Stream.of(userFactory.createNew(VALUE_FACTORY.createIRI(userId))).collect(Collectors.toSet());
        Set<String> roles = Stream.of("user").collect(Collectors.toSet());
        GroupConfig config = new GroupConfig.Builder(groupName1).description("Test")
                .members(members).roles(roles).build();
        Group group = engine.createGroup(config);

        assertEquals(group.getResource().stringValue(), groupId1);
        assertEquals(group.getMember_resource().size(), members.size());
        assertEquals(group.getHasGroupRole_resource().size(), roles.size());
        assertTrue(group.getProperty(VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue())).isPresent()
                && group.getProperty(VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue())).get().stringValue().equals(groupName1));
        assertTrue(group.getProperty(VALUE_FACTORY.createIRI(DCTERMS.DESCRIPTION.stringValue())).isPresent()
                && group.getProperty(VALUE_FACTORY.createIRI(DCTERMS.DESCRIPTION.stringValue())).get().stringValue().equals("Test"));
    }

    @Test
    public void testStoreGroup() {
        Resource newGroupId = VALUE_FACTORY.createIRI("http://mobi.com/users/newgroup");
        Group newGroup = groupFactory.createNew(newGroupId);
        newGroup.setProperty(VALUE_FACTORY.createLiteral("newgroup"), VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue()));
        engine.storeGroup(newGroup);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(newGroupId, null, null);
        assertTrue(statements.hasNext());
        statements.close();
        connection.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void testStoreGroupWithNoTitle() {
        Resource newGroupId = VALUE_FACTORY.createIRI("http://mobi.com/users/newgroup");
        Group newGroup = groupFactory.createNew(newGroupId);
        engine.storeGroup(newGroup);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testStoreGroupThatAlreadyExists() {
        Group group= groupFactory.createNew(VALUE_FACTORY.createIRI(groupId1));
        engine.storeGroup(group);
    }

    @Test
    public void testGroupExists() {
        boolean result = engine.groupExists(groupName1);
        assertTrue(result);

        result = engine.groupExists("http://mobi.com/groups/error");
        assertFalse(result);
    }

    @Test
    public void testGroupExistsWithResource() {
        boolean result = engine.groupExists(VALUE_FACTORY.createIRI(groupId1));
        assertTrue(result);

        result = engine.groupExists(VALUE_FACTORY.createIRI("http://mobi.com/groups/error"));
        assertFalse(result);
    }

    @Test
    public void testRetrieveGroup() {
        Optional<Group> groupOptional = engine.retrieveGroup(groupName1);

        assertTrue(groupOptional.isPresent());
        Group group = groupOptional.get();
        assertEquals(group.getResource().stringValue(), groupId1);
    }

    @Test
    public void testRetrieveGroupThatDoesNotExist() {
        Optional<Group> groupOptional= engine.retrieveGroup("http://mobi.com/groups/error");
        assertFalse(groupOptional.isPresent());
    }

    @Test
    public void testUpdateGroup() {
        Group newGroup = groupFactory.createNew(VALUE_FACTORY.createIRI(groupId1));
        engine.updateGroup(newGroup);
        Model groupModel = MODEL_FACTORY.createEmptyModel();
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(VALUE_FACTORY.createIRI(groupId1), null, null);
        statements.forEach(groupModel::add);
        connection.close();
        assertFalse(groupModel.isEmpty());
        Optional<Group> optGroup = groupFactory.getExisting(VALUE_FACTORY.createIRI(groupId1), groupModel);
        assertTrue(optGroup.isPresent());
        Group savedGroup = optGroup.get();
        assertTrue(savedGroup.getMember().isEmpty());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateGroupThatDoesNotExist() {
        Group newGroup = groupFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/groups/error"));
        engine.updateGroup(newGroup);
    }

    @Test
    public void testDeleteGroup() {
        engine.deleteGroup(groupName1);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(VALUE_FACTORY.createIRI(groupId1), null, null);
        assertFalse(statements.hasNext());
        statements.close();
        connection.close();
    }

    @Test(expected = IllegalArgumentException.class)
    public void testDeleteGroupThatDoesNotExist() {
        engine.deleteGroup("http://mobi.com/group/error");
    }

    @Test
    public void testGetUserRoles() {
        Set<Role> roles = engine.getUserRoles(username);
        assertFalse(roles.isEmpty());
        Set<Resource> roleIds = roles.stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        assertTrue(roleIds.contains(VALUE_FACTORY.createIRI(userRoleId)));
        assertTrue(roleIds.contains(VALUE_FACTORY.createIRI(adminRoleId)));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUserRolesThatDoesNotExist() {
        engine.getUserRoles("http://mobi.com/users/error");
    }

    @Test
    public void testCheckPasswordWithoutEncryption() {
        // Setup:
        when(encryptionSupport.getEncryption()).thenReturn(null);

        boolean result = engine.checkPassword(username, password);
        assertTrue(result);

        result = engine.checkPassword(username, "password");
        assertFalse(result);
    }

    @Test
    public void testCheckPasswordWithEncryption() {
        boolean result = engine.checkPassword(username, password);
        assertTrue(result);

        when(encryption.checkPassword(anyString(), anyString())).thenReturn(false);
        result = engine.checkPassword(username, "password");
        assertFalse(result);
    }

    @Test
    public void testCheckPasswordUserDoesNotExist() {
        boolean result = engine.checkPassword("error", password);
        assertFalse(result);
    }
}
