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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.GroupFactory;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.engines.RdfEngine;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rest.util.MobiRestTestNg;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.ArgumentCaptor;
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
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class GroupRestImplTest extends MobiRestTestNg {
    private GroupRestImpl rest;
    private ValueFactory vf;
    private OrmFactory<User> userFactory;
    private OrmFactory<Group> groupFactory;
    private OrmFactory<Role> roleFactory;
    private User user;
    private Group group;
    private Role role;
    private Set<User> users;
    private Set<Group> groups;
    private Set<Role> roles;
    private static final String ENGINE_NAME = "com.mobi.jaas.engines.RdfEngine";

    @Mock
    private EngineManager engineManager;

    @Mock
    private RdfEngine rdfEngine;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private GroupFactory groupFactoryMock;

    @Override
    protected Application configureApp() throws Exception {
        vf = getValueFactory();
        userFactory = getRequiredOrmFactory(User.class);
        groupFactory = getRequiredOrmFactory(Group.class);
        roleFactory = getRequiredOrmFactory(Role.class);

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
        when(transformer.sesameModel(any(Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameStatement(any(Statement.class)))
                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class)))
                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));

        when(groupFactoryMock.createNew(any(Resource.class), any(Model.class))).thenReturn(group);

        when(rdfEngine.getEngineName()).thenReturn(ENGINE_NAME);

        rest = spy(new GroupRestImpl());
        injectOrmFactoryReferencesIntoService(rest);
        rest.setEngineManager(engineManager);
        rest.setRdfEngine(rdfEngine);
        rest.setValueFactory(vf);
        rest.setGroupFactory(groupFactoryMock);
        rest.setTransformer(transformer);

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(engineManager);
        when(engineManager.getUsers()).thenReturn(users);
        when(engineManager.userExists(anyString())).thenReturn(true);
        when(engineManager.userExists("error")).thenReturn(false);
        when(engineManager.createUser(eq(ENGINE_NAME), any(UserConfig.class))).thenReturn(user);
        when(engineManager.retrieveUser(eq(ENGINE_NAME), anyString())).thenReturn(Optional.of(user));
        when(engineManager.retrieveUser(ENGINE_NAME, "error")).thenReturn(Optional.empty());
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(engineManager.retrieveUser("error")).thenReturn(Optional.empty());
        when(engineManager.getGroups()).thenReturn(groups);
        when(engineManager.groupExists(anyString())).thenReturn(true);
        when(engineManager.groupExists("error")).thenReturn(false);
        when(engineManager.createGroup(eq(ENGINE_NAME), any(GroupConfig.class))).thenReturn(group);
        when(engineManager.retrieveGroup(eq(ENGINE_NAME), anyString())).thenReturn(Optional.of(group));
        when(engineManager.retrieveGroup(ENGINE_NAME, "error")).thenReturn(Optional.empty());
        when(engineManager.retrieveGroup(anyString())).thenReturn(Optional.of(group));
        when(engineManager.retrieveGroup("error")).thenReturn(Optional.empty());
        when(engineManager.getRole(eq(ENGINE_NAME), anyString())).thenReturn(Optional.of(role));
        when(engineManager.getRole(anyString())).thenReturn(Optional.of(role));
        when(engineManager.getUsername(any(Resource.class))).thenReturn(Optional.of("user"));
    }

    @Test
    public void getGroupsTest() {
        Response response = target().path("groups").request().get();
        verify(engineManager, atLeastOnce()).getGroups();
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

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "newGroup");
        fd.field("description", "This is a description");
        fd.field("members", "John Doe");
        fd.field("members", "Jane Doe");
        fd.field("roles", "admin");
        Response response = target().path("groups")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        verify(engineManager).storeGroup(eq(ENGINE_NAME), any(Group.class));
    }

    @Test
    public void createGroupWithoutTitleTest() {
        // Setup:
        when(engineManager.groupExists(anyString())).thenReturn(false);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("description", "This is a description");
        fd.field("members", "John Doe");
        fd.field("members", "Jane Doe");
        fd.field("roles", "admin");
        Response response = target().path("groups")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createExistingGroupTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "testGroup");
        fd.field("description", "This is a description");
        Response response = target().path("groups")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getGroupTest() {
        Response response = target().path("groups/testGroup").request().get();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup("testGroup");
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertFalse(result.containsKey("@graph"));
        assertTrue(result.containsKey("@id"));
        assertEquals(result.getString("@id"), group.getResource().stringValue());
    }

    @Test
    public void getGroupThatDoesNotExistTest() {
        Response response = target().path("groups/error").request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void updateGroupTest() {
        Response response = target().path("groups/testGroup")
                .request()
                .put(Entity.entity(groupedModelToString(group.getModel(), getRDFFormat("jsonld"), transformer),
                        MediaType.APPLICATION_JSON_TYPE));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup(ENGINE_NAME, "testGroup");
        verify(engineManager).updateGroup(eq(ENGINE_NAME), any(Group.class));
    }

    @Test
    public void updateGroupWithDifferentTitleTest() {
        //Setup:
        Group newGroup = groupFactory.createNew(vf.createIRI("http://mobi.com/groups/group2"));
        newGroup.setTitle(Collections.singleton(vf.createLiteral("group2")));

        Response response = target().path("groups/group2")
                .request().put(Entity.entity(groupedModelToString(group.getModel(), getRDFFormat("jsonld"), transformer),
                        MediaType.APPLICATION_JSON_TYPE));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateGroupThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveGroup(eq(ENGINE_NAME), anyString())).thenReturn(Optional.empty());

        Response response = target().path("groups/testGroup")
                .request().put(Entity.entity(groupedModelToString(user.getModel(), getRDFFormat("jsonld"), transformer),
                        MediaType.APPLICATION_JSON_TYPE));
        assertEquals(response.getStatus(), 400);
        verify(engineManager, atLeastOnce()).retrieveGroup(ENGINE_NAME, "testGroup");
    }

    @Test
    public void deleteGroupTest() {
        Response response = target().path("groups/testGroup").request().delete();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).deleteGroup(ENGINE_NAME, "testGroup");
    }

    @Test
    public void deleteGroupThatDoesNotExistTest() {
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
        Response response = target().path("groups/error/roles").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addGroupRolesTest() {
        //Setup:
        Map<String, Role> roles = IntStream.range(1, 3)
                .mapToObj(Integer::toString)
                .collect(Collectors.toMap(s -> s, s -> roleFactory.createNew(vf.createIRI("http://mobi.com/roles/" + s))));
        Group newGroup = groupFactory.createNew(vf.createIRI("http://mobi.com/groups/testGroup"));
        newGroup.setHasGroupRole(Collections.singleton(role));
        when(engineManager.getRole(anyString())).thenAnswer(i -> Optional.of(roles.get(i.getArgumentAt(0, String.class))));
        when(engineManager.retrieveGroup(anyString())).thenReturn(Optional.of(newGroup));

        Response response = target().path("groups/testGroup/roles").queryParam("roles", roles.keySet().toArray())
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup("testGroup");
        roles.keySet().forEach(s -> verify(engineManager).getRole(s));
        ArgumentCaptor<Group> captor = ArgumentCaptor.forClass(Group.class);
        verify(engineManager).updateGroup(captor.capture());
        Group updatedGroup = captor.getValue();
        assertEquals(newGroup.getResource(), updatedGroup.getResource());
        Set<Resource> updatedRoles = updatedGroup.getHasGroupRole_resource();
        assertEquals(roles.size() + 1, updatedRoles.size());
        assertTrue(updatedRoles.contains(role.getResource()));
        roles.values().forEach(role -> assertTrue(updatedRoles.contains(role.getResource())));
    }

    @Test
    public void addRoleToGroupThatDoesNotExistTest() {
        //Setup:
        String[] roles = {"testRole"};

        Response response = target().path("groups/error/roles").queryParam("roles", roles)
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addRoleThatDoesNotExistToGroupTest() {
        //Setup:
        when(engineManager.getRole(anyString())).thenReturn(Optional.empty());
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
        verify(engineManager).retrieveGroup("testGroup");
        ArgumentCaptor<Group> captor = ArgumentCaptor.forClass(Group.class);
        verify(engineManager).updateGroup(captor.capture());
        Group updatedGroup = captor.getValue();
        assertEquals(group.getResource(), updatedGroup.getResource());
        assertEquals(0, updatedGroup.getHasGroupRole_resource().size());
    }

    @Test
    public void removeRoleFromGroupThatDoesNotExistTest() {
        Response response = target().path("groups/error/roles").queryParam("role", "testRole")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeRoleThatDoesNotExistFromGroupTest() {
        //Setup:
        when(engineManager.getRole(anyString())).thenReturn(Optional.empty());

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
        // Setup:
        when(engineManager.getUsername(any(Resource.class))).thenReturn(Optional.empty());

        Response response = target().path("groups/testGroup/users").request().get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void getGroupUsersGroupDoesNotExistTest() {
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
        newGroup.setMember(Collections.singleton(user));
        when(engineManager.retrieveUser(anyString())).thenAnswer(i -> Optional.of(users.get(i.getArgumentAt(0, String.class))));
        when(engineManager.retrieveGroup(eq(ENGINE_NAME), anyString())).thenReturn(Optional.of(newGroup));

        Response response = target().path("groups/testGroup/users").queryParam("users", users.keySet().toArray())
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveGroup(ENGINE_NAME, "testGroup");
        users.keySet().forEach(s -> verify(engineManager).retrieveUser(s));
        ArgumentCaptor<Group> captor = ArgumentCaptor.forClass(Group.class);
        verify(engineManager).updateGroup(eq(ENGINE_NAME), captor.capture());
        Group updatedGroup = captor.getValue();
        assertEquals(newGroup.getResource(), updatedGroup.getResource());
        Set<Resource> updatedMembers = updatedGroup.getMember_resource();
        assertEquals(users.size() + 1, updatedMembers.size());
        assertTrue(updatedMembers.contains(user.getResource()));
        users.values().forEach(user -> assertTrue(updatedMembers.contains(user.getResource())));
    }

    @Test
    public void addGroupUserToGroupThatDoesNotExistTest() {
        Response response = target().path("groups/error/users").request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void addGroupUserThatDoesNotExistTest() {
        // Setup:
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
        verify(engineManager).retrieveGroup(ENGINE_NAME, "testGroup");
        verify(engineManager).retrieveUser("tester");
        ArgumentCaptor<Group> captor = ArgumentCaptor.forClass(Group.class);
        verify(engineManager).updateGroup(eq(ENGINE_NAME), captor.capture());
        Group updatedGroup = captor.getValue();
        assertEquals(group.getResource(), updatedGroup.getResource());
        assertEquals(0, updatedGroup.getMember_resource().size());
    }

    @Test
    public void removeGroupUserFromGroupThatDoesNotExistTest() {
        Response response = target().path("groups/error/users").queryParam("user", "tester")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeGroupUserTHatDoesNotExistTest() {
        Response response = target().path("groups/testGroup/users").queryParam("user", "error")
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }
}
