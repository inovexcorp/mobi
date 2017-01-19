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
import org.matonto.jaas.api.engines.GroupConfig;
import org.matonto.jaas.api.engines.UserConfig;
import org.matonto.jaas.api.ontologies.usermanagement.*;
import org.matonto.jaas.rest.providers.*;
import org.matonto.ontologies.foaf.AgentFactory;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
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
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.*;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

public class GroupRestImplTest extends MatontoRestTestNg {
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

        role = roleFactory.createNew(vf.createIRI("http://matonto.org/roles/user"));
        role.setProperty(vf.createLiteral("user"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        roles = Collections.singleton(role);

        user = userFactory.createNew(vf.createIRI("http://matonto.org/users/testUser"), role.getModel());
        user.setHasUserRole(roles);
        users = Collections.singleton(user);

        group = groupFactory.createNew(vf.createIRI("http://matonto.org/groups/testGroup"), role.getModel());
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
        assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertTrue(result.size() == groups.size());
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
        assertEquals(200, response.getStatus());
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
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createExistingGroupTest() {
        //Setup:
        JSONObject group = new JSONObject();
        group.put("title", "testGroup");
        group.put("description", "This is a description");

        Response response = target().path("groups")
                .request().post(Entity.entity(group.toString(), MediaType.APPLICATION_JSON));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getGroupTest() {
        Response response = target().path("groups/testGroup").request().get();
        assertEquals(200, response.getStatus());
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertTrue(result.get("title").equals("testGroup"));
    }

    @Test
    public void getGroupThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error").request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateGroupTest() {
        //Setup:
        JSONObject group = new JSONObject();
        group.put("title", "testGroup");
        group.put("description", "This is a new description");

        Response response = target().path("groups/testGroup")
                .request().put(Entity.entity(group.toString(), MediaType.APPLICATION_JSON));
        assertEquals(200, response.getStatus());
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void updateGroupWithDifferentTitleTest() {
        //Setup:
        JSONObject group = new JSONObject();
        group.put("title", "newGroup");
        group.put("description", "This is a new description");
        Group newGroup = groupFactory.createNew(vf.createIRI("http://matonto.org/groups/" + group.getString("title")));
        newGroup.setProperty(vf.createLiteral(group.getString("title")), vf.createIRI(DCTERMS.TITLE.stringValue()));
        newGroup.setProperty(vf.createLiteral(group.getString("description")),
                vf.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        when(engineManager.createGroup(anyString(), any(GroupConfig.class))).thenReturn(newGroup);

        Response response = target().path("groups/testGroup")
                .request().put(Entity.entity(group.toString(), MediaType.APPLICATION_JSON));
        assertEquals(400, response.getStatus());
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
        assertEquals(400, response.getStatus());
    }

    @Test
    public void deleteGroupTest() {
        Response response = target().path("groups/testGroup").request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager).deleteGroup(anyString(), eq("testGroup"));
    }

    @Test
    public void deleteGroupThatDoesNotExistTest() {
        //Setup:
        when(engineManager.groupExists(anyString())).thenReturn(false);

        Response response = target().path("groups/error").request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getGroupRolesTest() {
        Response response = target().path("groups/testGroup/roles").request().get();
        assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(roles.size(), result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getGroupRolesThatDoNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error/roles").request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void addGroupRoleTest() {
        Response response = target().path("groups/testGroup/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(200, response.getStatus());
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void addRoleToGroupThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void addRoleThatDoesNotExistToGroupTest() {
        //Setup:
        when(engineManager.getRole(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/testgroup/roles").queryParam("role", "error")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeGroupRoleTest() {
        Response response = target().path("groups/testGroup/roles").queryParam("role", "testRole")
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager).retrieveGroup(anyString(), eq("testGroup"));
        verify(engineManager).updateGroup(anyString(), any(Group.class));
    }

    @Test
    public void removeRoleFromGroupThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/error/roles").queryParam("role", "testRole")
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeRoleThatDoesNotExistFromGroupTest() {
        //Setup:
        when(engineManager.getRole(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/testGroup/roles").queryParam("role", "error")
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getGroupUsersTest() {
        Response response = target().path("groups/testGroup/users").request().get();
        assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertTrue(result.size() == users.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getGroupUsersThatDoNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/testGroup/users").request().get();
        assertEquals(400, response.getStatus());
    }
}
