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

import org.apache.karaf.jaas.modules.Encryption;
import org.apache.karaf.jaas.modules.encryption.EncryptionSupport;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.GroupConfig;
import org.matonto.jaas.api.engines.UserConfig;
import org.matonto.jaas.api.ontologies.usermanagement.*;
import org.matonto.ontologies.foaf.Agent;
import org.matonto.ontologies.foaf.AgentFactory;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.*;
import org.matonto.rdf.orm.impl.ThingFactory;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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

    private String userId = "http://matonto.org/users/tester";
    private String password = "test";
    private String groupId = "http://matonto.org/groups/testers";
    private String userRoleId = "http://matonto.org/roles/user";
    private String adminRoleId = "http://matonto.org/roles/admin";
    private boolean setUp = false;
    private Map<String, Object> options = new HashMap<>();

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
            Group testGroup = groupFactory.createNew(vf.createIRI(groupId));
            roles.add(adminRole);
            testGroup.setHasGroupRole(roles);
            Set<Agent> members = Stream.of(testUser).collect(Collectors.toSet());
            testGroup.setMember(members);
            RepositoryConnection conn = repo.getConnection();
            conn.add(userRole.getModel(), vf.createIRI("http://matonto.org/usermanagement"));
            conn.add(adminRole.getModel(), vf.createIRI("http://matonto.org/usermanagement"));
            conn.add(testUser.getModel(), vf.createIRI("http://matonto.org/usermanagement"));
            conn.add(testGroup.getModel(), vf.createIRI("http://matonto.org/usermanagement"));
            conn.close();
            setUp = true;
        }

        options.put("encryption.enabled", false);
        options.put("encryption.name", "basic");
        options.put("encryption.prefix", "{CRYPT}");
        options.put("encryption.suffix", "{CRYPT}");
        options.put("encryption.algorithm", "MD5");
        options.put("encryption.encoding", "hexadecimal");
        engine.start(options);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
    }

    @Test
    public void testGetUsers() throws Exception {
        Set<User> users = engine.getUsers();
        Assert.assertTrue(!users.isEmpty());
    }

    @Test
    public void testCreateUser() throws Exception {
        Set<String> roles = Stream.of("user").collect(Collectors.toSet());
        UserConfig config = new UserConfig.Builder("user", "password", roles).email("example@example.com")
                .firstName("John").lastName("Doe").build();
        User user = engine.createUser(config);

        Assert.assertTrue(user.getResource().stringValue().contains("user"));
        Assert.assertTrue(user.getUsername().isPresent() && user.getUsername().get().stringValue().equals("user"));
        Assert.assertTrue(user.getPassword().isPresent() && user.getPassword().get().stringValue().equals("password"));
        Assert.assertTrue(user.getHasUserRole().size() == roles.size());
        Assert.assertTrue(!user.getMbox().isEmpty() && user.getMbox().size() == 1);
        Assert.assertTrue(user.getMbox().stream().map(thing -> thing.getResource().stringValue()).collect(Collectors.toSet()).contains("mailto:example@example.com"));
        Assert.assertTrue(!user.getFirstName().isEmpty() && user.getFirstName().size() == 1);
        Assert.assertTrue(user.getFirstName().stream().map(Value::stringValue).collect(Collectors.toSet()).contains("John"));
        Assert.assertTrue(!user.getLastName().isEmpty() && user.getLastName().size() == 1);
        Assert.assertTrue(user.getLastName().stream().map(Value::stringValue).collect(Collectors.toSet()).contains("Doe"));
    }

    @Test
    public void testStoreUser() throws Exception {
        Resource newUserId = vf.createIRI("http://matonto.org/users/newuser");
        User newUser = userFactory.createNew(newUserId);
        boolean result = engine.storeUser(newUser);

        Assert.assertTrue(result);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(newUserId, null, null);
        Assert.assertTrue(statements.hasNext());
        connection.close();
    }

    @Test(expected = MatOntoException.class)
    public void testStoreUserThatAlreadyExists() {
        User user = userFactory.createNew(vf.createIRI(userId));
        engine.storeUser(user);
    }

    @Test
    public void testUserExists() throws Exception {
        boolean result = engine.userExists(userId);
        Assert.assertTrue(result);

        result = engine.userExists("http://matonto.org/users/error");
        Assert.assertFalse(result);
    }

    @Test
    public void testRetrieveUser() throws Exception {
        Optional<User> userOptional = engine.retrieveUser(userId);

        Assert.assertTrue(userOptional.isPresent());
        User user = userOptional.get();
        Assert.assertTrue(user.getResource().stringValue().equals(userId));
        Assert.assertTrue(user.getPassword().isPresent());
        Assert.assertTrue(user.getPassword().get().stringValue().equals(password));
    }

    @Test
    public void testRetrieveUserThatDoesNotExist() throws Exception {
        Optional<User> userOptional = engine.retrieveUser("http://matonto.org/users/error");
        Assert.assertFalse(userOptional.isPresent());
    }

    @Test
    public void testUpdateUser() throws Exception {
        User newUser = userFactory.createNew(vf.createIRI(userId));
        newUser.setPassword(vf.createLiteral("123"));
        newUser.setUsername(vf.createLiteral("user"));
        boolean result = engine.updateUser(newUser);

        Assert.assertTrue(result);
        Model userModel = mf.createModel();
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(vf.createIRI(userId), null, null);
        statements.forEach(userModel::add);
        connection.close();
        Assert.assertFalse(userModel.isEmpty());
        User savedUser = userFactory.getExisting(vf.createIRI(userId), userModel);
        Assert.assertTrue(savedUser.getPassword().isPresent() && savedUser.getPassword().get().stringValue().equals("123"));
        Assert.assertTrue(savedUser.getUsername().isPresent() && savedUser.getUsername().get().stringValue().equals("user"));
    }

    @Test(expected = MatOntoException.class)
    public void testUpdateUserThatDoesNotExist() {
        User newUser = userFactory.createNew(vf.createIRI("http://matonto.org/users/error"));
        engine.updateUser(newUser);
    }

    @Test
    public void testDeleteUser() throws Exception {
        boolean result = engine.deleteUser(userId);
        Assert.assertTrue(result);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(vf.createIRI(userId), null, null);
        Assert.assertTrue(!statements.hasNext());
        statements = connection.getStatements(null, null, vf.createIRI(userId));
        Assert.assertTrue(!statements.hasNext());
        connection.close();
    }

    @Test(expected = MatOntoException.class)
    public void testDeleteUserThatDoesNotExist() {
        engine.deleteUser("http://matonto.org/users/error");
    }

    @Test
    public void testGetGroups() throws Exception {
        Set<Group> groups= engine.getGroups();
        Assert.assertTrue(!groups.isEmpty());
    }

    @Test
    public void testCreateGroup() throws Exception {
        Set<String> members = Stream.of("tester").collect(Collectors.toSet());
        Set<String> roles = Stream.of("user").collect(Collectors.toSet());
        GroupConfig config = new GroupConfig.Builder("group").description("Test")
                .members(members).roles(roles).build();
        Group group = engine.createGroup(config);

        Assert.assertTrue(group.getResource().stringValue().contains("group"));
        Assert.assertTrue(group.getMember().size() == members.size());
        Assert.assertTrue(group.getHasGroupRole().size() == roles.size());
        Assert.assertTrue(group.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue())).isPresent()
                && group.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue())).get().stringValue().equals("group"));
        Assert.assertTrue(group.getProperty(vf.createIRI(DCTERMS.DESCRIPTION.stringValue())).isPresent()
                && group.getProperty(vf.createIRI(DCTERMS.DESCRIPTION.stringValue())).get().stringValue().equals("Test"));
    }

    @Test
    public void testStoreGroup() throws Exception {
        Resource newGroupId = vf.createIRI("http://matonto.org/users/newgroup");
        Group newGroup = groupFactory.createNew(newGroupId);
        boolean result = engine.storeGroup(newGroup);

        Assert.assertTrue(result);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(newGroupId, null, null);
        Assert.assertTrue(statements.hasNext());
        connection.close();
    }

    @Test(expected = MatOntoException.class)
    public void testStoreGroupThatAlreadyExists() {
        Group group= groupFactory.createNew(vf.createIRI(groupId));
        engine.storeGroup(group);
    }

    @Test
    public void testGroupExists() throws Exception {
        boolean result = engine.groupExists(groupId);
        Assert.assertTrue(result);

        result = engine.groupExists("http://matonto.org/groups/error");
        Assert.assertFalse(result);
    }

    @Test
    public void testRetrieveGroup() throws Exception {
        Optional<Group> groupOptional = engine.retrieveGroup(groupId);

        Assert.assertTrue(groupOptional.isPresent());
        Group group = groupOptional.get();
        Assert.assertTrue(group.getResource().stringValue().equals(groupId));
    }

    @Test
    public void testRetrieveGroupThatDoesNotExist() throws Exception {
        Optional<Group> groupOptional= engine.retrieveGroup("http://matonto.org/groups/error");
        Assert.assertFalse(groupOptional.isPresent());
    }

    @Test
    public void testUpdateGroup() throws Exception {
        Group newGroup = groupFactory.createNew(vf.createIRI(groupId));
        boolean result = engine.updateGroup(newGroup);

        Assert.assertTrue(result);
        Model groupModel = mf.createModel();
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(vf.createIRI(groupId), null, null);
        statements.forEach(groupModel::add);
        connection.close();
        Assert.assertFalse(groupModel.isEmpty());
        Group savedGroup = groupFactory.getExisting(vf.createIRI(groupId), groupModel);
        Assert.assertTrue(savedGroup.getMember().isEmpty());
    }

    @Test(expected = MatOntoException.class)
    public void testUpdateGroupThatDoesNotExist() {
        Group newGroup = groupFactory.createNew(vf.createIRI("http://matonto.org/groups/error"));
        engine.updateGroup(newGroup);
    }

    @Test
    public void testDeleteGroup() throws Exception {
        boolean result = engine.deleteGroup(groupId);
        Assert.assertTrue(result);
        RepositoryConnection connection = repo.getConnection();
        RepositoryResult<Statement> statements = connection.getStatements(vf.createIRI(groupId), null, null);
        Assert.assertTrue(!statements.hasNext());
        connection.close();
    }

    @Test(expected = MatOntoException.class)
    public void testDeleteGroupThatDoesNotExist() {
        engine.deleteGroup("http://matonto.org/group/error");
    }

    @Test
    public void testGetUserRoles() throws Exception {
        Set<Role> roles = engine.getUserRoles(userId);
        Assert.assertFalse(roles.isEmpty());
        Set<Resource> roleIds = roles.stream()
                .map(Thing::getResource)
                .collect(Collectors.toSet());
        Assert.assertTrue(roleIds.contains(vf.createIRI(userRoleId)));
        Assert.assertTrue(roleIds.contains(vf.createIRI(adminRoleId)));
    }

    @Test(expected = MatOntoException.class)
    public void testGetUserRolesThatDoesNotExist() {
        engine.getUserRoles("http://matonto.org/users/error");
    }

    @Test
    public void testCheckPasswordWithoutEncryption() throws Exception {
        boolean result = engine.checkPassword(userId, password);
        Assert.assertTrue(result);

        result = engine.checkPassword(userId, "password");
        Assert.assertFalse(result);
    }
}
