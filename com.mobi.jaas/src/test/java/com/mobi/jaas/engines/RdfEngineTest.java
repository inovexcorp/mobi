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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.when;

import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.GroupFactory;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.RoleFactory;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.ontologies.foaf.Agent;
import com.mobi.ontologies.foaf.AgentFactory;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.LiteralValueConverter;
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import com.mobi.rdf.orm.impl.ThingFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.karaf.jaas.modules.Encryption;
import org.apache.karaf.jaas.modules.encryption.EncryptionSupport;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.osgi.framework.BundleContext;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RunWith(PowerMockRunner.class)
@PrepareForTest(RdfEngine.class)
public class RdfEngineTest {
    private Repository repo;
    private RdfEngine engine;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private UserFactory userFactory = new UserFactory();
    private GroupFactory groupFactory = new GroupFactory();
    private RoleFactory roleFactory = new RoleFactory();
    private AgentFactory agentFactory = new AgentFactory();
    private ThingFactory thingFactory = new ThingFactory();

    private String username = "tester";
    private String userId = "http://mobi.com/users/" + DigestUtils.sha1Hex(username);
    private String password = "test";
    private String groupName1 = "cats";
    private String groupId1 = "http://mobi.com/groups/" + DigestUtils.sha1Hex(groupName1);
    private String groupName2 = "dogs";
    private String groupId2 = "http://mobi.com/groups/" + DigestUtils.sha1Hex(groupName2);
    private String userRoleId = "http://mobi.com/roles/user";
    private String adminRoleId = "http://mobi.com/roles/admin";
    private String context = "http://mobi.com/usermanagement";
    private boolean setUp = false;
    private Map<String, Object> options = new HashMap<>();

    @Mock
    BundleContext bundleContext;

    @Mock
    Encryption encryption;

    @Mock
    EncryptionSupport encryptionSupport;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        groupFactory.setModelFactory(mf);
        groupFactory.setValueFactory(vf);
        groupFactory.setValueConverterRegistry(vcr);
        roleFactory.setModelFactory(mf);
        roleFactory.setValueFactory(vf);
        roleFactory.setValueConverterRegistry(vcr);
        agentFactory.setModelFactory(mf);
        agentFactory.setValueFactory(vf);
        agentFactory.setValueConverterRegistry(vcr);
        thingFactory.setModelFactory(mf);
        thingFactory.setValueFactory(vf);
        thingFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(userFactory);
        vcr.registerValueConverter(groupFactory);
        vcr.registerValueConverter(roleFactory);
        vcr.registerValueConverter(agentFactory);
        vcr.registerValueConverter(thingFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        engine = new RdfEngine();
        engine.setRepository(repo);
        engine.setValueFactory(vf);
        engine.setModelFactory(mf);
        engine.setUserFactory(userFactory);
        engine.setGroupFactory(groupFactory);
        engine.setRoleFactory(roleFactory);
        engine.setThingFactory(thingFactory);

        if (!setUp) {
            Role userRole = roleFactory.createNew(vf.createIRI(userRoleId));
            Role adminRole = roleFactory.createNew(vf.createIRI(adminRoleId));
            Set<Role> roles = Stream.of(userRole).collect(Collectors.toSet());
            User testUser = userFactory.createNew(vf.createIRI(userId));
            testUser.setPassword(vf.createLiteral(password));
            testUser.setHasUserRole(roles);
            roles.add(adminRole);
            Set<Agent> members = Stream.of(testUser).collect(Collectors.toSet());
            Group testGroup1 = groupFactory.createNew(vf.createIRI(groupId1));
            Group testGroup2 = groupFactory.createNew(vf.createIRI(groupId2));
            testGroup1.setHasGroupRole(roles);
            testGroup2.setHasGroupRole(Collections.singleton(roleFactory.createNew(vf.createIRI(adminRoleId))));
            testGroup1.setMember(members);
            testGroup2.setMember(members);
            RepositoryConnection conn = repo.getConnection();
            conn.add(testUser.getModel(), vf.createIRI(context));
            conn.add(testGroup1.getModel(), vf.createIRI(context));
            conn.add(testGroup2.getModel(), vf.createIRI(context));
            conn.close();
            setUp = true;
        }

        PowerMockito.whenNew(EncryptionSupport.class).withAnyArguments().thenReturn(encryptionSupport);
        when(encryptionSupport.getEncryption()).thenReturn(encryption);
        when(encryptionSupport.getEncryptionPrefix()).thenReturn("");
        when(encryptionSupport.getEncryptionSuffix()).thenReturn("");
        when(encryption.checkPassword(anyString(), anyString())).thenReturn(true);
        when(encryption.encryptPassword(anyString())).thenAnswer(i -> i.getArgumentAt(0, String.class));

        options.put("roles", new String[] {"admin", "user"});
        options.put("encryption.enabled", false);
        options.put("encryption.name", "basic");
        options.put("encryption.prefix", "{CRYPT}");
        options.put("encryption.suffix", "{CRYPT}");
        options.put("encryption.algorithm", "MD5");
        options.put("encryption.encoding", "hexadecimal");

        engine.start(bundleContext, options);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    @Test
    public void testGetRole() throws Exception {
        Optional<Role> roleOptional = engine.getRole("user");

        assertTrue(roleOptional.isPresent());
        Role role = roleOptional.get();
        assertEquals(role.getResource(), (vf.createIRI(userRoleId)));
    }

    @Test
    public void testGetRoleThatDoesNotExist() throws Exception {
        Optional<Role> roleOptional = engine.getRole("error");
        assertFalse(roleOptional.isPresent());
    }

    @Test
    public void testGetUsers() throws Exception {
        Set<User> users = engine.getUsers();
        assertTrue(!users.isEmpty());
    }

    @Test
    public void testCreateUser() throws Exception {
        Set<String> roles = Stream.of("user").collect(Collectors.toSet());
        UserConfig config = new UserConfig.Builder(username, password, roles).email("example@example.com")
                .firstName("John").lastName("Doe").build();
        User user = engine.createUser(config);

        assertTrue(user.getResource().stringValue().equals(userId));
        assertTrue(user.getUsername().isPresent() && user.getUsername().get().stringValue().equals(username));
        assertTrue(user.getPassword().isPresent() && user.getPassword().get().stringValue().equals(password));
        assertEquals(user.getHasUserRole_resource().size(), roles.size());
        assertTrue(!user.getMbox_resource().isEmpty() && user.getMbox_resource().size() == 1);
        assertTrue(user.getMbox_resource().stream().map(resource -> resource.stringValue()).collect(Collectors.toSet()).contains("mailto:example@example.com"));
        assertTrue(!user.getFirstName().isEmpty() && user.getFirstName().size() == 1);
        assertTrue(user.getFirstName().stream().map(Value::stringValue).collect(Collectors.toSet()).contains("John"));
        assertTrue(!user.getLastName().isEmpty() && user.getLastName().size() == 1);
        assertTrue(user.getLastName().stream().map(Value::stringValue).collect(Collectors.toSet()).contains("Doe"));
    }

    @Test
    public void testStoreUser() throws Exception {
        Resource newUserId = vf.createIRI("http://mobi.com/users/newuser");
        User newUser = userFactory.createNew(newUserId);
        newUser.setUsername(vf.createLiteral("newuser"));
        engine.storeUser(newUser);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(newUserId, null, null);
        assertTrue(statements.hasNext());
        connection.close();
    }

    @Test(expected = MobiException.class)
    public void testStoreUserWithNoUsername() {
        Resource newUserId = vf.createIRI("http://mobi.com/users/newuser");
        User newUser = userFactory.createNew(newUserId);
        engine.storeUser(newUser);
    }

    @Test(expected = MobiException.class)
    public void testStoreUserThatAlreadyExists() {
        User user = userFactory.createNew(vf.createIRI(userId));
        engine.storeUser(user);
    }

    @Test
    public void testUserExists() throws Exception {
        boolean result = engine.userExists(username);
        assertTrue(result);

        result = engine.userExists("http://mobi.com/users/error");
        assertFalse(result);
    }

    @Test
    public void testRetrieveUser() throws Exception {
        Optional<User> userOptional = engine.retrieveUser(username);

        assertTrue(userOptional.isPresent());
        User user = userOptional.get();
        assertEquals(user.getResource().stringValue(), userId);
        assertTrue(user.getPassword().isPresent());
        assertEquals(user.getPassword().get().stringValue(), password);
    }

    @Test
    public void testRetrieveUserThatDoesNotExist() throws Exception {
        Optional<User> userOptional = engine.retrieveUser("http://mobi.com/users/error");
        assertFalse(userOptional.isPresent());
    }

    @Test
    public void testUpdateUser() throws Exception {
        User newUser = userFactory.createNew(vf.createIRI(userId));
        newUser.setPassword(vf.createLiteral("123"));
        newUser.setUsername(vf.createLiteral("user"));
        engine.updateUser(newUser);
        Model userModel = mf.createModel();
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(vf.createIRI(userId), null, null);
        statements.forEach(userModel::add);
        connection.close();
        assertFalse(userModel.isEmpty());
        User savedUser = userFactory.getExisting(vf.createIRI(userId), userModel).get();
        assertTrue(savedUser.getPassword().isPresent() && savedUser.getPassword().get().stringValue().equals("123"));
        assertTrue(savedUser.getUsername().isPresent() && savedUser.getUsername().get().stringValue().equals("user"));
    }

    @Test(expected = MobiException.class)
    public void testUpdateUserThatDoesNotExist() {
        User newUser = userFactory.createNew(vf.createIRI("http://mobi.com/users/error"));
        engine.updateUser(newUser);
    }

    @Test
    public void testDeleteUser() throws Exception {
        engine.deleteUser(username);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(vf.createIRI(userId), null, null);
        assertTrue(!statements.hasNext());
        statements = connection.getStatements(null, null, vf.createIRI(userId));
        assertTrue(!statements.hasNext());
        connection.close();
    }

    @Test(expected = MobiException.class)
    public void testDeleteUserThatDoesNotExist() {
        engine.deleteUser("http://mobi.com/users/error");
    }

    @Test
    public void testGetGroups() throws Exception {
        Set<Group> groups= engine.getGroups();
        assertTrue(!groups.isEmpty());
    }

    @Test
    public void testCreateGroup() throws Exception {
        Set<String> members = Stream.of("tester").collect(Collectors.toSet());
        Set<String> roles = Stream.of("user").collect(Collectors.toSet());
        GroupConfig config = new GroupConfig.Builder(groupName1).description("Test")
                .members(members).roles(roles).build();
        Group group = engine.createGroup(config);

        assertEquals(group.getResource().stringValue(), groupId1);
        assertEquals(group.getMember_resource().size(), members.size());
        assertEquals(group.getHasGroupRole_resource().size(), roles.size());
        assertTrue(group.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue())).isPresent()
                && group.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue())).get().stringValue().equals(groupName1));
        assertTrue(group.getProperty(vf.createIRI(DCTERMS.DESCRIPTION.stringValue())).isPresent()
                && group.getProperty(vf.createIRI(DCTERMS.DESCRIPTION.stringValue())).get().stringValue().equals("Test"));
    }

    @Test
    public void testStoreGroup() throws Exception {
        Resource newGroupId = vf.createIRI("http://mobi.com/users/newgroup");
        Group newGroup = groupFactory.createNew(newGroupId);
        newGroup.setProperty(vf.createLiteral("newgroup"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        engine.storeGroup(newGroup);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(newGroupId, null, null);
        assertTrue(statements.hasNext());
        connection.close();
    }

    @Test(expected = MobiException.class)
    public void testStoreGroupWithNoTitle() {
        Resource newGroupId = vf.createIRI("http://mobi.com/users/newgroup");
        Group newGroup = groupFactory.createNew(newGroupId);
        engine.storeGroup(newGroup);
    }

    @Test(expected = MobiException.class)
    public void testStoreGroupThatAlreadyExists() {
        Group group= groupFactory.createNew(vf.createIRI(groupId1));
        engine.storeGroup(group);
    }

    @Test
    public void testGroupExists() throws Exception {
        boolean result = engine.groupExists(groupName1);
        assertTrue(result);

        result = engine.groupExists("http://mobi.com/groups/error");
        assertFalse(result);
    }

    @Test
    public void testRetrieveGroup() throws Exception {
        Optional<Group> groupOptional = engine.retrieveGroup(groupName1);

        assertTrue(groupOptional.isPresent());
        Group group = groupOptional.get();
        assertEquals(group.getResource().stringValue(), groupId1);
    }

    @Test
    public void testRetrieveGroupThatDoesNotExist() throws Exception {
        Optional<Group> groupOptional= engine.retrieveGroup("http://mobi.com/groups/error");
        assertFalse(groupOptional.isPresent());
    }

    @Test
    public void testUpdateGroup() throws Exception {
        Group newGroup = groupFactory.createNew(vf.createIRI(groupId1));
        engine.updateGroup(newGroup);
        Model groupModel = mf.createModel();
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(vf.createIRI(groupId1), null, null);
        statements.forEach(groupModel::add);
        connection.close();
        assertFalse(groupModel.isEmpty());
        Group savedGroup = groupFactory.getExisting(vf.createIRI(groupId1), groupModel).get();
        assertTrue(savedGroup.getMember().isEmpty());
    }

    @Test(expected = MobiException.class)
    public void testUpdateGroupThatDoesNotExist() {
        Group newGroup = groupFactory.createNew(vf.createIRI("http://mobi.com/groups/error"));
        engine.updateGroup(newGroup);
    }

    @Test
    public void testDeleteGroup() throws Exception {
        engine.deleteGroup(groupName1);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(vf.createIRI(groupId1), null, null);
        assertTrue(!statements.hasNext());
        connection.close();
    }

    @Test(expected = MobiException.class)
    public void testDeleteGroupThatDoesNotExist() {
        engine.deleteGroup("http://mobi.com/group/error");
    }

    @Test
    public void testGetUserRoles() throws Exception {
        Set<Role> roles = engine.getUserRoles(username);
        assertFalse(roles.isEmpty());
        Set<Resource> roleIds = roles.stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        assertTrue(roleIds.contains(vf.createIRI(userRoleId)));
        assertTrue(roleIds.contains(vf.createIRI(adminRoleId)));
    }

    @Test(expected = MobiException.class)
    public void testGetUserRolesThatDoesNotExist() {
        engine.getUserRoles("http://mobi.com/users/error");
    }

    @Test
    public void testCheckPasswordWithoutEncryption() throws Exception {
        // Setup:
        when(encryptionSupport.getEncryption()).thenReturn(null);

        boolean result = engine.checkPassword(username, password);
        assertTrue(result);

        result = engine.checkPassword(username, "password");
        assertFalse(result);
    }

    @Test
    public void testCheckPasswordWithEncryption() throws Exception {
        boolean result = engine.checkPassword(username, password);
        assertTrue(result);

        when(encryption.checkPassword(anyString(), anyString())).thenReturn(false);
        result = engine.checkPassword(username, "password");
        assertFalse(result);
    }
}
