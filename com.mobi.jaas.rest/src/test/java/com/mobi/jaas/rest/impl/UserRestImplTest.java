package com.mobi.jaas.rest.impl;

/*-
 * #%L
 * com.mobi.jaas.rest
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

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.GroupFactory;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.RoleFactory;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.jaas.engines.RdfEngine;
import com.mobi.jaas.rest.providers.GroupProvider;
import com.mobi.jaas.rest.providers.GroupSetProvider;
import com.mobi.jaas.rest.providers.RoleProvider;
import com.mobi.jaas.rest.providers.RoleSetProvider;
import com.mobi.jaas.rest.providers.UserProvider;
import com.mobi.ontologies.foaf.AgentFactory;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
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
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class UserRestImplTest extends MobiRestTestNg {
    private UserRestImpl rest;
    private UserProvider userProvider;
    private RoleProvider roleProvider;
    private RoleSetProvider roleSetProvider;
    private GroupProvider groupProvider;
    private GroupSetProvider groupSetProvider;
    private UserFactory userFactory;
    private GroupFactory groupFactory;
    private RoleFactory roleFactory;
    private AgentFactory agentFactory;
    private ThingFactory thingFactory;
    private ValueFactory vf;
    private ModelFactory mf;
    private ValueConverterRegistry vcr;
    private User user;
    private Group group;
    private Role role;
    private Thing email;
    private Set<User> users;
    private Set<Group> groups;
    private Set<Role> roles;

    @Mock
    private EngineManager engineManager;

    @Mock
    private RdfEngine rdfEngine;

    @Override
    protected Application configureApp() throws Exception {
        userProvider = new UserProvider();
        roleProvider = new RoleProvider();
        roleSetProvider = new RoleSetProvider();
        groupProvider = new GroupProvider();
        groupSetProvider = new GroupSetProvider();
        userFactory = new UserFactory();
        groupFactory = new GroupFactory();
        roleFactory = new RoleFactory();
        agentFactory = new AgentFactory();
        thingFactory = new ThingFactory();
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        vcr = new DefaultValueConverterRegistry();
        roleProvider.setFactory(vf);
        roleSetProvider.setFactory(vf);
        roleSetProvider.setRoleProvider(roleProvider);
        groupProvider.setFactory(vf);
        groupSetProvider.setFactory(vf);
        groupSetProvider.setGroupProvider(groupProvider);
        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        groupFactory.setModelFactory(mf);
        groupFactory.setValueFactory(vf);
        groupFactory.setValueConverterRegistry(vcr);
        roleFactory.setModelFactory(mf);
        roleFactory.setValueFactory(vf);
        roleFactory.setValueConverterRegistry(vcr);
        agentFactory.setValueFactory(vf);
        agentFactory.setModelFactory(mf);
        agentFactory.setValueConverterRegistry(vcr);
        thingFactory.setValueFactory(vf);
        thingFactory.setModelFactory(mf);
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

        email = thingFactory.createNew(vf.createIRI("mailto:example@example.com"));

        role = roleFactory.createNew(vf.createIRI("http://mobi.com/roles/user"));
        role.setProperty(vf.createLiteral("user"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        roles = Collections.singleton(role);

        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME), role.getModel());
        user.setHasUserRole(roles);
        user.setUsername(vf.createLiteral(UsernameTestFilter.USERNAME));
        user.setPassword(vf.createLiteral("ABC"));
        user.setMbox(Collections.singleton(email));
        users = Collections.singleton(user);

        group = groupFactory.createNew(vf.createIRI("http://mobi.com/groups/testGroup"), role.getModel());
        Role adminRole = roleFactory.createNew(vf.createIRI("http://mobi.com/roles/admin"), role.getModel());
        adminRole.setProperty(vf.createLiteral("admin"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        group.setHasGroupRole(Collections.singleton(adminRole));
        group.setMember(Collections.singleton(user));
        groups = Collections.singleton(group);

        MockitoAnnotations.initMocks(this);
        groupProvider.setRdfEngine(rdfEngine);
        userProvider.setEngineManager(engineManager);
        userProvider.setRdfEngine(rdfEngine);
        rest = spy(new UserRestImpl());
        rest.setEngineManager(engineManager);
        rest.setRdfEngine(rdfEngine);
        rest.setFactory(vf);

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class)
                .register(UsernameTestFilter.class)
                .register(userProvider)
                .register(groupProvider)
                .register(groupSetProvider)
                .register(roleProvider)
                .register(roleSetProvider);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
        config.register(userProvider);
        config.register(groupProvider);
        config.register(groupSetProvider);
        config.register(roleProvider);
        config.register(roleSetProvider);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(engineManager);
        reset(rdfEngine);
        when(engineManager.getUsers(anyString())).thenReturn(users);
        when(engineManager.userExists(anyString())).thenReturn(true);
        when(engineManager.userExists(UsernameTestFilter.USERNAME)).thenReturn(true);
        when(engineManager.createUser(anyString(), any(UserConfig.class))).thenReturn(user);
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.of(user));
        when(engineManager.checkPassword(anyString(), anyString(), anyString())).thenReturn(true);
        when(engineManager.getGroups(anyString())).thenReturn(groups);
        when(engineManager.groupExists(anyString())).thenReturn(true);
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.of(group));
        when(engineManager.getRole(anyString(), anyString())).thenReturn(Optional.of(role));
        when(engineManager.getUserRoles(anyString(), anyString())).thenReturn(Stream.concat(roles.stream(),
                group.getHasGroupRole().stream()).collect(Collectors.toSet()));
        when(engineManager.getUserRoles(UsernameTestFilter.USERNAME)).thenReturn(Stream.concat(roles.stream(),
                group.getHasGroupRole().stream()).collect(Collectors.toSet()));
        when(engineManager.getUsername(any(Resource.class))).thenReturn(Optional.empty());
        when(rdfEngine.getEngineName()).thenReturn("com.mobi.jaas.engines.RdfEngine");
    }

    @Test
    public void listUsersTest() {
        Response response = target().path("users").request().get();
        verify(engineManager, atLeastOnce()).getUsers(anyString());
        assertEquals(response.getStatus(), 200);
        try {
            String str = response.readEntity(String.class);
            JSONArray result = JSONArray.fromObject(str);
            assertEquals(result.size(), users.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createUserTest() {
        //Setup:
        JSONObject user = new JSONObject();
        user.put("username", "testUser");
        user.put("email", "example@example.com");
        user.put("firstName", "John");
        user.put("lastName", "Doe");
        when(engineManager.userExists(anyString())).thenReturn(false);

        Response response = target().path("users")
                .queryParam("password", "123")
                .request().post(Entity.entity(user.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 201);
        verify(engineManager).storeUser(anyString(), any(User.class));
    }

    @Test
    public void createUserWithoutPasswordTest() {
        //Setup:
        JSONObject user = new JSONObject();
        user.put("username", "testUser");
        user.put("email", "example@example.com");
        user.put("firstName", "John");
        user.put("lastName", "Doe");
        when(engineManager.userExists(anyString())).thenReturn(false);

        Response response = target().path("users")
                .request().post(Entity.entity(user.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createUserWithoutUsernameTest() {
        //Setup:
        JSONObject user = new JSONObject();
        user.put("email", "example@example.com");
        user.put("firstName", "John");
        user.put("lastName", "Doe");
        when(engineManager.userExists(anyString())).thenReturn(false);

        Response response = target().path("users")
                .queryParam("password", "123")
                .request().post(Entity.entity(user.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createExistingUserTest() {
        //Setup:
        JSONObject user = new JSONObject();
        user.put("username", UsernameTestFilter.USERNAME);
        user.put("email", "example@example.com");
        user.put("firstName", "John");
        user.put("lastName", "Doe");

        Response response = target().path("users")
                .queryParam("password", "123")
                .request().post(Entity.entity(user.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUserTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME).request().get();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        JSONObject user = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(user.containsKey("username"));
        assertEquals(user.getString("username"), UsernameTestFilter.USERNAME);
        assertTrue(user.containsKey("email"));
        assertEquals(user.getString("email"), email.getResource().stringValue());
    }

    @Test
    public void getUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error").request().get();
        assertEquals(response.getStatus(), 404);
        verify(engineManager).retrieveUser(anyString(), eq("error"));
    }

    @Test
    public void updateUserTest() {
        //Setup:
        JSONObject user = new JSONObject();
        user.put("username", UsernameTestFilter.USERNAME);
        user.put("email", "maryjane@example.com");
        user.put("firstName", "Mary");
        user.put("lastName", "Jane");

        Response response = target().path("users/" + UsernameTestFilter.USERNAME)
                .request().put(Entity.entity(user.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 200);
        verify(engineManager, atLeastOnce()).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void updateUserWithDifferentUsernameTest() {
        //Setup:
        JSONObject user = new JSONObject();
        user.put("username", "testUser");
        user.put("email", "maryjane@example.com");
        user.put("firstName", "Mary");
        user.put("lastName", "Jane");
        User newUser = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + user.getString("username")));
        newUser.setUsername(vf.createLiteral(user.getString("username")));
        newUser.setFirstName(Collections.singleton(vf.createLiteral(user.getString("firstName"))));
        newUser.setLastName(Collections.singleton(vf.createLiteral(user.getString("lastName"))));
        newUser.setMbox(Collections.singleton(thingFactory.createNew(vf.createIRI("mailto:" + user.getString("email")))));
        when(engineManager.createUser(anyString(), any(UserConfig.class))).thenReturn(newUser);

        Response response = target().path("users/" + UsernameTestFilter.USERNAME)
                .request().put(Entity.entity(user.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateUserThatDoesNotExistTest() {
        //Setup:
        JSONObject user = new JSONObject();
        user.put("username", "error");
        user.put("email", "maryjane@example.com");
        user.put("firstName", "Mary");
        user.put("lastName", "Jane");
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error")
                .request().put(Entity.entity(user.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void changePasswordTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("currentPassword", "ABC")
                .queryParam("newPassword", "XYZ")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).checkPassword(anyString(), eq(UsernameTestFilter.USERNAME), eq("ABC"));
        verify(engineManager, atLeastOnce()).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void changePasswordAsDifferentUserTest() {
        Response response = target().path("users/error/password")
                .queryParam("currentPassword", "ABC")
                .queryParam("newPassword", "XYZ")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 403);
    }

    @Test
    public void changePasswordWithoutCurrentPasswordTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("newPassword", "XYZ")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void changePasswordWithWrongPasswordTest() {
        // Setup:
        when(engineManager.checkPassword(anyString(), anyString(), eq("error"))).thenReturn(false);

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("currentPassword", "error")
                .queryParam("newPassword", "XYZ")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 401);
    }

    @Test
    public void changePasswordWithoutNewPasswordTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("currentPassword", "ABC")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void changePasswordForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("currentPassword", "ABC")
                .queryParam("newPassword", "XYZ")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void resetPasswordTest() {
        Response response = target().path("users/username/password")
                .queryParam("newPassword", "XYZ")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(engineManager, atLeastOnce()).retrieveUser(anyString(), eq("username"));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void resetPasswordWithoutNewPasswordTest() {
        Response response = target().path("users/username/password")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void resetPasswordOfUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), eq("error"))).thenReturn(Optional.empty());

        Response response = target().path("users/error/password")
                .queryParam("newPassword", "XYZ")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void deleteUserTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).deleteUser(anyString(), eq(UsernameTestFilter.USERNAME));
    }

    @Test
    public void deleteUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.userExists("error")).thenReturn(false);

        Response response = target().path("users/error").request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUserRolesTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").request().get();
        verify(engineManager).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        assertEquals(response.getStatus(), 200);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), roles.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getUserRolesIncludingGroupsTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("includeGroups", "true").request().get();
        verify(engineManager).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        assertEquals(response.getStatus(), 200);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), roles.size() + group.getHasGroupRole().size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getUserRolesThatDoNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error/roles").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addUserRolesTest() {
        // Setup:
        Map<String, Role> roles = new HashMap<>();
        IntStream.range(1, 3)
                .mapToObj(Integer::toString)
                .forEach(s -> roles.put(s, roleFactory.createNew(vf.createIRI("http://mobi.com/roles/" + s))));
        User newUser = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME));
        when(engineManager.getRole(anyString(), anyString())).thenAnswer(i -> Optional.of(roles.get(i.getArgumentAt(1, String.class))));
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.of(newUser));

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("roles", roles.keySet().toArray())
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        roles.keySet().forEach(s -> verify(engineManager).getRole(anyString(), eq(s)));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void addRolesToUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());
        String[] roles = {"testRole"};

        Response response = target().path("users/error/roles").queryParam("roles", roles)
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addRolesThatDoNotExistToUserTest() {
        //Setup:
        when(engineManager.getRole(anyString(), anyString())).thenReturn(Optional.empty());
        String[] roles = {"testRole"};

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("roles", roles)
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addUserRolesWithoutRolesTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeUserRoleTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("role", "testRole")
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void removeRoleFromUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error/roles").queryParam("role", "testRole")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeRoleThatDoesNotExistFromUserTest() {
        //Setup:
        when(engineManager.getRole(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("role", "error")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUserGroupsTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/groups").request().get();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        verify(engineManager).getGroups(anyString());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), groups.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void addUserGroupTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/groups").queryParam("group", "testGroup")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void addGroupToUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error/groups").queryParam("group", "testGroup")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addGroupThatDoesNotExistToUserTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/groups").queryParam("group", "error")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeUserGroupTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/groups").queryParam("group", "testGroup")
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void removeGroupFromUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error/groups").queryParam("group", "testGroup")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeGroupThatDoesNotExistFromUserTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/groups").queryParam("group", "error")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUsernameTest() {
        //Setup:
        when(engineManager.getUsername(user.getResource())).thenReturn(Optional.of(UsernameTestFilter.USERNAME));

        Response response = target().path("users/username").queryParam("iri", user.getResource())
                .request().get();
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), UsernameTestFilter.USERNAME);
    }

    @Test
    public void getUserForUserThatDoesNotExistTest() {
        Response response = target().path("users/username").queryParam("iri", "http://example.com/error")
                .request().get();
        assertEquals(response.getStatus(), 404);
    }
}
