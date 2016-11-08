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
import org.junit.Assert;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.engines.UserConfig;
import org.matonto.jaas.api.ontologies.usermanagement.*;
import org.matonto.jaas.rest.providers.*;
import org.matonto.ontologies.foaf.AgentFactory;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.*;
import org.matonto.rdf.orm.impl.ThingFactory;
import org.matonto.rest.util.MatontoRestTestNg;
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

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.*;

public class UserRestImplTest extends MatontoRestTestNg {
    private UserRestImpl rest;
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

        user = userFactory.createNew(vf.createIRI("http://matonto.org/users/testUser"), email.getModel());
        user.setHasUserRole(roles);
        user.setUsername(vf.createLiteral("testUser"));
        user.setPassword(vf.createLiteral("ABC"));
        user.setMbox(Collections.singleton(email));
        users = Collections.singleton(user);

        group = groupFactory.createNew(vf.createIRI("http://matonto.org/groups/testGroup"), email.getModel());
        group.setMember(Collections.singleton(user));
        groups = Collections.singleton(group);

        MockitoAnnotations.initMocks(this);
        rest = spy(new UserRestImpl());
        rest.setEngineManager(engineManager);
        rest.setFactory(vf);
        doReturn(true).when(rest).isAuthorizedUser(any(), any());

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class)
                .register(UserProvider.class)
                .register(groupProvider)
                .register(groupSetProvider)
                .register(roleProvider)
                .register(roleSetProvider);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
        config.register(UserProvider.class);
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
        when(engineManager.createUser(anyString(), any(UserConfig.class))).thenReturn(user);
        when(engineManager.storeUser(anyString(), any(User.class))).thenReturn(true);
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.of(user));
        when(engineManager.checkPassword(anyString(), anyString(), anyString())).thenReturn(true);
        when(engineManager.updateUser(anyString(), any(User.class))).thenReturn(true);
        when(engineManager.getGroups(anyString())).thenReturn(groups);
        when(engineManager.groupExists(anyString())).thenReturn(true);
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.of(group));
        when(engineManager.updateGroup(anyString(), any(Group.class))).thenReturn(true);
    }

    @Test
    public void listUsersTest() {
        Response response = target().path("users").request().get();
        verify(engineManager, atLeastOnce()).getUsers(anyString());
        Assert.assertEquals(200, response.getStatus());
        try {
            String str = response.readEntity(String.class);
            JSONArray result = JSONArray.fromObject(str);
            Assert.assertTrue(result.size() == users.size());
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createUserTest() {
        //Setup:
        when(engineManager.userExists(anyString())).thenReturn(false);

        Response response = target().path("users")
                .queryParam("username", "testUser1").queryParam("password", "123")
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        verify(engineManager).storeUser(anyString(), any(User.class));
    }

    @Test
    public void createExistingUserTest() {
        Response response = target().path("users")
                .queryParam("username", "testUser1")
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());

        response = target().path("users")
                .queryParam("password", "123")
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());

        response = target().path("users")
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());

        response = target().path("users").queryParam("username", "testUser")
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getUserTest() {
        Response response = target().path("users/testUser").request().get();
        Assert.assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(anyString(), eq("testUser"));
        JSONObject user = JSONObject.fromObject(response.readEntity(String.class));
        Assert.assertTrue(user.containsKey("username"));
    }

    @Test
    public void getUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error").request().get();
        Assert.assertEquals(400, response.getStatus());
        verify(engineManager).retrieveUser(anyString(), eq("error"));
    }

    @Test
    public void updateUserTest() {
        Response response = target().path("users/testUser")
                .queryParam("currentPassword", "ABC")
                .queryParam("newPassword", "XYZ")
                .queryParam("firstName", "John")
                .queryParam("lastName", "Doe")
                .queryParam("email", "johndoe@example.com")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(anyString(), eq("testUser"));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void updateUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error")
                .queryParam("currentPassword", "ABC")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUserWithoutCurrentPasswordTest() {
        Response response = target().path("users/testUser")
                .queryParam("newPassword", "XYZ")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void deleteUserTest() {
        Response response = target().path("users/testUser").request().delete();
        Assert.assertEquals(200, response.getStatus());
        verify(engineManager).deleteUser(anyString(), eq("testUser"));
    }

    @Test
    public void deleteUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.userExists(anyString())).thenReturn(false);

        Response response = target().path("users/error").request().delete();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getUserRolesTest() {
        Response response = target().path("users/testUser/roles").request().get();
        verify(engineManager).retrieveUser(anyString(), eq("testUser"));
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.size() == roles.size());
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getUserRolesThatDoNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error/roles").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void addUserRoleTest() {
        Response response = target().path("users/testUser/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(anyString(), eq("testUser"));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void addRoleToUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void removeUserRoleTest() {
        Response response = target().path("users/testUser/roles").queryParam("role", "testRole")
                .request().delete();
        Assert.assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(anyString(), eq("testUser"));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void removeRoleFromUserThatDoesNotExist() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error/roles").queryParam("role", "testRole")
                .request().delete();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getUserGroupsTest() {
        Response response = target().path("users/testUser/groups").request().get();
        Assert.assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(anyString(), eq("testUser"));
        verify(engineManager).getGroups(anyString());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.size() == groups.size());
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void addUserGroupTest() {
        Response response = target().path("users/testUser/groups").queryParam("group", "testGroup")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void addGroupToUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error/groups").queryParam("group", "testGroup")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void addGroupThatDoesNotExistToUserTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/testUser/groups").queryParam("group", "error")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void removeUserGroupTest() {
        Response response = target().path("users/testUser/groups").queryParam("group", "testGroup")
                .request().delete();
        Assert.assertEquals(200, response.getStatus());
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void removeGroupFromUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/error/groups").queryParam("group", "testGroup")
                .request().delete();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void removeGroupThatDoesNotExistFromUserTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/testUser/groups").queryParam("group", "error")
                .request().delete();
        Assert.assertEquals(400, response.getStatus());
    }
}
