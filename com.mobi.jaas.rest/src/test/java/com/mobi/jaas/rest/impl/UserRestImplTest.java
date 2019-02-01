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
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.jaas.engines.RdfEngine;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
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
    private ValueFactory vf;
    private OrmFactory<User> userFactory;
    private OrmFactory<Role> roleFactory;
    private OrmFactory<Thing> thingFactory;
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

    @Mock
    private SesameTransformer transformer;

    @Mock
    private UserFactory userFactoryMock;

    @Override
    protected Application configureApp() throws Exception {
        vf = getValueFactory();
        OrmFactory<Group> groupFactory = getRequiredOrmFactory(Group.class);
        userFactory = getRequiredOrmFactory(User.class);
        roleFactory = getRequiredOrmFactory(Role.class);
        thingFactory = getRequiredOrmFactory(Thing.class);

        email = thingFactory.createNew(vf.createIRI("mailto:example@example.com"));

        role = roleFactory.createNew(vf.createIRI("http://mobi.com/roles/user"));
        role.setProperty(vf.createLiteral("user"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        roles = Collections.singleton(role);

        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME), role.getModel());
        user.setHasUserRole(roles);
        user.setUsername(vf.createLiteral(UsernameTestFilter.USERNAME));
        user.setMbox(Collections.singleton(email));
        users = Collections.singleton(user);

        group = groupFactory.createNew(vf.createIRI("http://mobi.com/groups/testGroup"), role.getModel());
        Role adminRole = roleFactory.createNew(vf.createIRI("http://mobi.com/roles/admin"), role.getModel());
        adminRole.setProperty(vf.createLiteral("admin"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        group.setHasGroupRole(Collections.singleton(adminRole));
        group.setMember(Collections.singleton(user));
        groups = Collections.singleton(group);

        MockitoAnnotations.initMocks(this);
        when(transformer.sesameModel(any(Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameStatement(any(Statement.class)))
                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class)))
                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(userFactoryMock.createNew(any(Resource.class), any(Model.class))).thenReturn(user);

        rest = new UserRestImpl();
        rest.setEngineManager(engineManager);
        rest.setRdfEngine(rdfEngine);
        rest.setValueFactory(vf);
        rest.setTransformer(transformer);
        rest.setUserFactory(userFactoryMock);

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class)
                .register(UsernameTestFilter.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        user.setPassword(vf.createLiteral("ABC"));

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
    public void getUsersTest() {
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
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("username", "testUser");
        fd.field("email", "example@example.com");
        fd.field("firstName", "John");
        fd.field("lastName", "Doe");
        fd.field("password", "123");
        fd.field("roles", "admin");
        fd.field("roles", "user");
        when(engineManager.userExists(anyString())).thenReturn(false);

        Response response = target().path("users")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        verify(engineManager).storeUser(anyString(), any(User.class));
    }

    @Test
    public void createUserWithoutPasswordTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("username", "testUser");
        fd.field("email", "example@example.com");
        fd.field("firstName", "John");
        fd.field("lastName", "Doe");

        when(engineManager.userExists(anyString())).thenReturn(false);

        Response response = target().path("users")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createUserWithoutUsernameTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("email", "example@example.com");
        fd.field("firstName", "John");
        fd.field("lastName", "Doe");
        fd.field("password", "123");

        when(engineManager.userExists(anyString())).thenReturn(false);

        Response response = target().path("users")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createExistingUserTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("username", "testUser");
        fd.field("email", "example@example.com");
        fd.field("firstName", "John");
        fd.field("lastName", "Doe");
        fd.field("password", "123");

        Response response = target().path("users")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUserTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME).request().get();
        assertEquals(response.getStatus(), 200);
        verify(engineManager).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
        assertFalse(result.containsKey("@graph"));
        assertTrue(result.containsKey("@id"));
        assertEquals(result.getString("@id"), user.getResource().stringValue());
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
        Response response = target().path("users/" + UsernameTestFilter.USERNAME)
                .request().put(Entity.entity(groupedModelToString(user.getModel(), getRDFFormat("jsonld"), transformer),
                        MediaType.APPLICATION_JSON_TYPE));
        assertEquals(response.getStatus(), 200);
        verify(engineManager, atLeastOnce()).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
        verify(engineManager).updateUser(anyString(), any(User.class));
    }

    @Test
    public void updateUserWithDifferentUsernameTest() {
        //Setup:
        User newUser = userFactory.createNew(vf.createIRI("http://mobi.com/users/user2"));
        newUser.setUsername(vf.createLiteral("user2"));

        Response response = target().path("users/user2")
                .request().put(Entity.entity(groupedModelToString(user.getModel(), getRDFFormat("jsonld"), transformer),
                        MediaType.APPLICATION_JSON_TYPE));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME)
                .request().put(Entity.entity(groupedModelToString(user.getModel(), getRDFFormat("jsonld"), transformer),
                        MediaType.APPLICATION_JSON_TYPE));
        assertEquals(response.getStatus(), 400);
        verify(engineManager, atLeastOnce()).retrieveUser(anyString(), eq(UsernameTestFilter.USERNAME));
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
                .request().put(Entity.entity("user", MediaType.MULTIPART_FORM_DATA));
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
