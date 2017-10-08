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

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.GroupFactory;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.RoleFactory;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.jaas.rest.providers.GroupProvider;
import com.mobi.jaas.rest.providers.RoleProvider;
import com.mobi.jaas.rest.providers.RoleSetProvider;
import com.mobi.jaas.rest.providers.UserProvider;
import com.mobi.jaas.rest.providers.UserSetProvider;
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
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.*;
import com.mobi.jaas.rest.providers.*;
import com.mobi.ontologies.foaf.AgentFactory;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingFactory;
import com.mobi.rest.util.MobiRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.IntStream;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.*;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

public class GroupRestImplTest extends MobiRestTestNg {
    private GroupRestImpl rest;
    private GroupProvider groupProvider;
    private RoleProvider roleProvider;
    private RoleSetProvider roleSetProvider;
    private UserProvider userProvider;
    private UserSetProvider userSetProvider;
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
    private Set<User> users;
    private Set<Group> groups;
    private Set<Role> roles;

    @Mock
    EngineManager engineManager;

    @Override
    protected Application configureApp() throws Exception {
        groupProvider = new GroupProvider();
        roleProvider = new RoleProvider();
        roleSetProvider = new RoleSetProvider();
        userProvider = new UserProvider();
        userSetProvider = new UserSetProvider();
        userFactory = new UserFactory();
        groupFactory = new GroupFactory();
        roleFactory = new RoleFactory();
        agentFactory = new AgentFactory();
        thingFactory = new ThingFactory();
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        vcr = new DefaultValueConverterRegistry();
        groupProvider.setFactory(vf);
        roleProvider.setFactory(vf);
        roleSetProvider.setFactory(vf);
        roleSetProvider.setRoleProvider(roleProvider);
        userSetProvider.setUserProvider(userProvider);
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

        role = roleFactory.createNew(vf.createIRI("http://mobi.com/roles/user"));
        role.setProperty(vf.createLiteral("user"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        roles = Collections.singleton(role);

        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/testUser"), role.getModel());
        user.setHasUserRole(roles);
        users = Collections.singleton(user);

        group = groupFactory.createNew(vf.createIRI("http://mobi.com/groups/testGroup"), role.getModel());
        group.setHasGroupRole(roles);
        group.setProperty(vf.createLiteral("testGroup"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        group.setProperty(vf.createLiteral("This is a description"), vf.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        group.setMember(Collections.singleton(user));
        groups = Collections.singleton(group);

        // Setup rest
        MockitoAnnotations.initMocks(this);
        groupProvider.setEngineManager(engineManager);
        rest = spy(new GroupRestImpl());
        rest.setEngineManager(engineManager);
        rest.setFactory(vf);
        rest.setUserFactory(userFactory);

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class)
                .register(userProvider)
                .register(userSetProvider)
                .register(groupProvider)
                .register(roleProvider)
                .register(roleSetProvider);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
        config.register(userProvider);
        config.register(userSetProvider);
        config.register(groupProvider);
        config.register(roleProvider);
        config.register(roleSetProvider);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(engineManager);
        when(engineManager.getUsers(anyString())).thenReturn(users);
        when(engineManager.userExists(anyString())).thenReturn(true);
        when(engineManager.createUser(anyString(), any(UserConfig.class))).thenReturn(user);
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.of(user));
        when(engineManager.getGroups(anyString())).thenReturn(groups);
        when(engineManager.groupExists(anyString())).thenReturn(true);
        when(engineManager.createGroup(anyString(), any(GroupConfig.class))).thenReturn(group);
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.of(group));
        when(engineManager.getRole(anyString(), anyString())).thenReturn(Optional.of(role));
    }

    @Test
    public void listGroupsTest() {
        Response response = target().path("groups").request().get();
        verify(engineManager, atLeastOnce()).getGroups(anyString());
        assertEquals(response.getStatus(), 200);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), groups.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createGroupTest() {
        // Setup:
        when(engineManager.groupExists(anyString())).thenReturn(false);
        JSONObject group = new JSONObject();
        group.put("title", "newGroup");
        group.put("description", "This is a description");

        Response response = target().path("groups")
                .request().post(Entity.entity(group.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 201);
        verify(engineManager).storeGroup(anyString(), any(Group.class));
    }

    @Test
    public void createGroupWithoutTitleTest() {
        // Setup:
        when(engineManager.groupExists(anyString())).thenReturn(false);
        JSONObject group = new JSONObject();
        group.put("description", "This is a description");

        Response response = target().path("groups")
                .request().post(Entity.entity(group.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createExistingGroupTest() {
        //Setup:
        JSONObject group = new JSONObject();
        group.put("title", "testGroup");
        group.put("description", "This is a description");

        Response response = target().path("groups")
                .request().post(Entity.entity(group.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getGroupTest() {
        Response response = target().path("groups/testGroup").request().get();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertEquals(result.get("title"), "testGroup");
    }

    @Test
    public void getGroupThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error").request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void updateGroupTest() {
        //Setup:
        JSONObject group = new JSONObject();
        group.put("title", "testGroup");
        group.put("description", "This is a new description");

        Response response = target().path("groups/testGroup")
                .request().put(Entity.entity(group.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void updateGroupWithDifferentTitleTest() {
        //Setup:
        JSONObject group = new JSONObject();
        group.put("title", "newGroup");
        group.put("description", "This is a new description");
        Group newGroup = groupFactory.createNew(vf.createIRI("http://mobi.com/groups/" + group.getString("title")));
        newGroup.setProperty(vf.createLiteral(group.getString("title")), vf.createIRI(DCTERMS.TITLE.stringValue()));
        newGroup.setProperty(vf.createLiteral(group.getString("description")),
                vf.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        when(engineManager.createGroup(anyString(), any(GroupConfig.class))).thenReturn(newGroup);

        Response response = target().path("groups/testGroup")
                .request().put(Entity.entity(group.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateGroupThatDoesNotExistTest() {
        //Setup:
        JSONObject group = new JSONObject();
        group.put("title", "testGroup");
        group.put("description", "This is a new description");
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error")
                .request().put(Entity.entity(group.toString(), MediaType.APPLICATION_JSON));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void deleteGroupTest() {
        Response response = target().path("groups/testGroup").request().delete();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).deleteGroup(anyString(), eq("testGroup"));
    }

    @Test
    public void deleteGroupThatDoesNotExistTest() {
        //Setup:
        when(engineManager.groupExists(anyString())).thenReturn(false);

        Response response = target().path("groups/error").request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getGroupRolesTest() {
        Response response = target().path("groups/testGroup/roles").request().get();
        assertEquals(response.getStatus(), 200);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), roles.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getGroupRolesThatDoNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error/roles").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addGroupRolesTest() {
        //Setup:
        Map<String, Role> roles = new HashMap<>();
        IntStream.range(1, 3)
                .mapToObj(Integer::toString)
                .forEach(s -> roles.put(s, roleFactory.createNew(vf.createIRI("http://mobi.com/roles/" + s))));
        Group newGroup = groupFactory.createNew(vf.createIRI("http://mobi.com/groups/testGroup"));
        when(engineManager.getRole(anyString(), anyString())).thenAnswer(i -> Optional.of(roles.get(i.getArgumentAt(1, String.class))));
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.of(newGroup));

        Response response = target().path("groups/testGroup/roles").queryParam("roles", roles.keySet().toArray())
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        roles.keySet().forEach(s -> verify(engineManager).getRole(anyString(), eq(s)));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void addRoleToGroupThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());
        String[] roles = {"testRole"};

        Response response = target().path("groups/error/roles").queryParam("roles", roles)
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addRoleThatDoesNotExistToGroupTest() {
        //Setup:
        when(engineManager.getRole(anyString(), anyString())).thenReturn(Optional.empty());
        String[] roles = {"testRole"};

        Response response = target().path("groups/testGroup/roles").queryParam("roles", roles)
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addGroupRolesWithoutRolesTest() {
        Response response = target().path("groups/testGroup/roles")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeGroupRoleTest() {
        Response response = target().path("groups/testGroup/roles").queryParam("role", "testRole")
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void removeRoleFromGroupThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error/roles").queryParam("role", "testRole")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeRoleThatDoesNotExistFromGroupTest() {
        //Setup:
        when(engineManager.getRole(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/testGroup/roles").queryParam("role", "error")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getGroupUsersTest() {
        Response response = target().path("groups/testGroup/users").request().get();
        assertEquals(response.getStatus(), 200);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), users.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getGroupUsersThatDoNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error/users").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addGroupUserTest() {
        // Setup:
        Map<String, User> users = new HashMap<>();
        IntStream.range(1, 6)
                .mapToObj(Integer::toString)
                .forEach(s -> users.put(s, userFactory.createNew(vf.createIRI("http://mobi.com/users/" + s))));
        Group newGroup = groupFactory.createNew(vf.createIRI("http://mobi.com/groups/testGroup"));
        when(engineManager.retrieveUser(anyString(), anyString())).thenAnswer(i -> Optional.of(users.get(i.getArgumentAt(1, String.class))));
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.of(newGroup));

        Response response = target().path("groups/testGroup/users").queryParam("users", users.keySet().toArray())
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        users.keySet().forEach(s -> verify(engineManager).retrieveUser(anyString(), eq(s)));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void addGroupUserToGroupThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error/users").request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addGroupUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());
        String[] usernames = {"error"};

        Response response = target().path("groups/testGroup/users").queryParam("users", usernames)
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeGroupUserTest() {
        Response response = target().path("groups/testGroup/users").queryParam("user", "tester")
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        verify(engineManager).retrieveUser(anyString(), eq("tester"));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void removeGroupUserFromGroupThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error/users").queryParam("user", "tester")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeGroupUserTHatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/testGroup/users").queryParam("user", "error")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }
}
