package org.matonto.jaas.rest.impl;

/*-
 * #%L
 * org.matonto.jaas.rest
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

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.engines.UserConfig;
import org.matonto.jaas.api.ontologies.usermanagement.*;
import org.matonto.jaas.rest.providers.*;
import org.matonto.ontologies.foaf.AgentFactory;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.*;
import org.matonto.rdf.orm.impl.ThingFactory;
import org.matonto.rest.util.MatontoRestTestNg;
import org.matonto.rest.util.UsernameTestFilter;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.*;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

public class UserRestImplTest extends MatontoRestTestNg {
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
    EngineManager engineManager;

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

        role = roleFactory.createNew(vf.createIRI("http://matonto.org/roles/user"), email.getModel());
        role.setProperty(vf.createLiteral("user"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        roles = Collections.singleton(role);

        user = userFactory.createNew(vf.createIRI("http://matonto.org/users/" + UsernameTestFilter.USERNAME), email.getModel());
        user.setHasUserRole(roles);
        user.setUsername(vf.createLiteral(UsernameTestFilter.USERNAME));
        user.setPassword(vf.createLiteral("ABC"));
        user.setMbox(Collections.singleton(email));
        users = Collections.singleton(user);

        group = groupFactory.createNew(vf.createIRI("http://matonto.org/groups/testGroup"), email.getModel());
        Role adminRole = roleFactory.createNew(vf.createIRI("http://matonto.org/roles/admin"), email.getModel());
        adminRole.setProperty(vf.createLiteral("admin"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        group.setHasGroupRole(Collections.singleton(adminRole));
        group.setMember(Collections.singleton(user));
        groups = Collections.singleton(group);

        MockitoAnnotations.initMocks(this);
        userProvider.setEngineManager(engineManager);
        rest = spy(new UserRestImpl());
        rest.setEngineManager(engineManager);
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
        assertEquals(response.getStatus(), 200);
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
    }

    @Test
    public void getUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error").request().get();
        assertEquals(response.getStatus(), 400);
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
        User newUser = userFactory.createNew(vf.createIRI("http://matonto.org/users/" + user.getString("username")));
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
    public void updatePasswordTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("currentPassword", "ABC")
                .queryParam("newPassword", "XYZ")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).checkPassword(anyString(), eq(UsernameTestFilter.USERNAME), eq("ABC"));
        verify(engineManager, atLeastOnce()).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void updatePasswordWithoutCurrentPasswordTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("newPassword", "XYZ")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updatePasswordWithoutNewPasswordTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("currentPassword", "ABC")
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
    public void addUserRoleTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void addRoleToUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addRoleThatDoesNotExistToUserTest() {
        //Setup:
        when(engineManager.getRole(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("role", "error")
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
