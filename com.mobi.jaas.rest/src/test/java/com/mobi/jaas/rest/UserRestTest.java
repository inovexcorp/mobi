package com.mobi.jaas.rest;

/*-
 * #%L
 * com.mobi.jaas.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.jaas.engines.RdfEngine;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class UserRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private static final ObjectMapper mapper = new ObjectMapper();
    private OrmFactory<User> userFactory;
    private OrmFactory<Group> groupFactory;
    private OrmFactory<Role> roleFactory;
    private OrmFactory<Thing> thingFactory;
    private User user;
    private Group group;
    private Role role;
    private Role adminRole;
    private Thing email;
    private Set<User> users;
    private Set<Group> groups;
    private Set<Role> roles;
    private IRI inProgressCommitIRI1;
    private IRI inProgressCommitIRI2;
    private IRI stateIRI;
    private static final String ENGINE_NAME = "com.mobi.jaas.engines.RdfEngine";

    // Mock services used in server
    private static UserRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private static EngineManager engineManager;
    private static RdfEngine rdfEngine;
    private static UserFactory userFactoryMock;
    private static CommitManager commitManager;
    private static StateManager stateManager;
    private static CatalogConfigProvider configProvider;

    @Mock
    private User adminUserMock;

    @Mock
    private InProgressCommit inProgressCommit1;

    @Mock
    private InProgressCommit inProgressCommit2;

    @Mock
    private OsgiRepository repo;

    @Mock
    private RepositoryConnection conn;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        mf = getModelFactory();

        engineManager = Mockito.mock(EngineManager.class);
        rdfEngine = Mockito.mock(RdfEngine.class);
        userFactoryMock = Mockito.mock(UserFactory.class);
        engineManager = Mockito.mock(EngineManager.class);
        
        commitManager = Mockito.mock(CommitManager.class);
        stateManager = Mockito.mock(StateManager.class);
        configProvider = Mockito.mock(CatalogConfigProvider.class);

        rest = new UserRest();
        rest.engineManager = engineManager;
        rest.rdfEngine = rdfEngine;
        rest.userFactory = userFactoryMock;
        rest.commitManager = commitManager;
        rest.stateManager = stateManager;
        rest.configProvider = configProvider;

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        reset(engineManager, commitManager, stateManager);

        groupFactory = getRequiredOrmFactory(Group.class);
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
        adminRole = roleFactory.createNew(vf.createIRI("http://mobi.com/roles/admin"), role.getModel());
        adminRole.setProperty(vf.createLiteral("admin"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        group.setHasGroupRole(Collections.singleton(adminRole));
        group.setMember(Collections.singleton(user));
        groups = Collections.singleton(group);

        inProgressCommitIRI1 = vf.createIRI("urn:inProgressCommit1");
        inProgressCommitIRI2 = vf.createIRI("urn:inProgressCommit2");
        stateIRI = vf.createIRI("urn:state1");

        when(userFactoryMock.createNew(any(Resource.class), any(Model.class))).thenReturn(user);
        when(rdfEngine.getEngineName()).thenReturn(ENGINE_NAME);

        user.setPassword(vf.createLiteral("ABC"));

        when(engineManager.getUsers()).thenReturn(users);
        when(engineManager.userExists(anyString())).thenReturn(true);
        when(engineManager.userExists("error")).thenReturn(false);
        when(engineManager.createUser(eq(ENGINE_NAME), any(UserConfig.class))).thenReturn(user);
        when(engineManager.retrieveUser(eq(ENGINE_NAME), anyString())).thenReturn(Optional.of(user));
        when(engineManager.retrieveUser(ENGINE_NAME, "error")).thenReturn(Optional.empty());
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(engineManager.retrieveUser("error")).thenReturn(Optional.empty());
        when(engineManager.checkPassword(eq(ENGINE_NAME), anyString(), anyString())).thenReturn(true);
        when(engineManager.getGroups()).thenReturn(groups);
        when(engineManager.groupExists(anyString())).thenReturn(true);
        when(engineManager.groupExists("error")).thenReturn(false);
        when(engineManager.retrieveGroup(eq(ENGINE_NAME), anyString())).thenReturn(Optional.of(group));
        when(engineManager.retrieveGroup(ENGINE_NAME, "error")).thenReturn(Optional.empty());
        when(engineManager.retrieveGroup(anyString())).thenReturn(Optional.of(group));
        when(engineManager.retrieveGroup("error")).thenReturn(Optional.empty());
        when(engineManager.getRole(eq(ENGINE_NAME), anyString())).thenReturn(Optional.of(role));
        when(engineManager.getRole(anyString())).thenReturn(Optional.of(role));
        when(engineManager.getUserRoles(eq(ENGINE_NAME), anyString())).thenReturn(Stream.concat(roles.stream(),
                group.getHasGroupRole().stream()).collect(Collectors.toSet()));
        when(engineManager.getUserRoles(UsernameTestFilter.USERNAME)).thenReturn(Stream.concat(roles.stream(),
                group.getHasGroupRole().stream()).collect(Collectors.toSet()));
        when(engineManager.getUsername(any(Resource.class))).thenReturn(Optional.empty());

        when(inProgressCommit1.getResource()).thenReturn(inProgressCommitIRI1);
        when(inProgressCommit2.getResource()).thenReturn(inProgressCommitIRI2);
        when(commitManager.getInProgressCommits(eq(user), any(RepositoryConnection.class))).thenReturn(Arrays.asList(inProgressCommit1, inProgressCommit2));

        Map<Resource, Model> states = new HashMap<>();
        states.put(stateIRI, mf.createEmptyModel());
        when(stateManager.getStates(eq(UsernameTestFilter.USERNAME), eq(null), any(Set.class))).thenReturn(states);

        when(configProvider.getRepository()).thenReturn(repo);
        when(repo.getConnection()).thenReturn(conn);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void getUsersTest() {
        Response response = target().path("users").request().get();
        verify(engineManager, atLeastOnce()).getUsers();
        assertEquals(200, response.getStatus());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
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
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(201, response.getStatus());
        verify(engineManager).storeUser(eq(ENGINE_NAME), any(User.class));
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
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
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
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
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
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getUserTest() throws Exception {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME).request().get();
        assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(UsernameTestFilter.USERNAME);
        ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
        assertFalse(result.has("@graph"));
        assertTrue(result.has("@id"));
        assertEquals(user.getResource().stringValue(), result.get("@id").asText());
    }

    @Test
    public void getUserThatDoesNotExistTest() {
        Response response = target().path("users/error").request().get();
        assertEquals(404, response.getStatus());
        verify(engineManager).retrieveUser("error");
    }

    @Test
    public void updateUserTest() {
        //Setup:
        Response response = target().path("users/" + UsernameTestFilter.USERNAME)
                .request().put(Entity.entity(groupedModelToString(user.getModel(), getRDFFormat("jsonld")),
                        MediaType.APPLICATION_JSON_TYPE));
        assertEquals(200, response.getStatus());
        verify(engineManager, atLeastOnce()).retrieveUser(ENGINE_NAME, UsernameTestFilter.USERNAME);
        verify(engineManager).updateUser(eq(ENGINE_NAME), any(User.class));
    }

    @Test
    public void updateUserWithDifferentUsernameTest() {
        //Setup:
        User newUser = userFactory.createNew(vf.createIRI("http://mobi.com/users/user2"));
        newUser.setUsername(vf.createLiteral("user2"));

        Response response = target().path("users/user2")
                .request().put(Entity.entity(groupedModelToString(user.getModel(), getRDFFormat("jsonld")),
                        MediaType.APPLICATION_JSON_TYPE));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(ENGINE_NAME, UsernameTestFilter.USERNAME)).thenReturn(Optional.empty());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME)
                .request().put(Entity.entity(groupedModelToString(user.getModel(), getRDFFormat("jsonld")),
                        MediaType.APPLICATION_JSON_TYPE));
        assertEquals(400, response.getStatus());
        verify(engineManager, atLeastOnce()).retrieveUser(ENGINE_NAME, UsernameTestFilter.USERNAME);
    }

    @Test
    public void changePasswordTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("currentPassword", "ABC")
                .queryParam("newPassword", "XYZ")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(200, response.getStatus());
        verify(engineManager).checkPassword(ENGINE_NAME, UsernameTestFilter.USERNAME, "ABC");
        verify(engineManager, atLeastOnce()).retrieveUser(ENGINE_NAME, UsernameTestFilter.USERNAME);
        verify(engineManager).updateUser(eq(ENGINE_NAME), any(User.class));
    }

    @Test
    public void changePasswordAsDifferentUserTest() {
        Response response = target().path("users/error/password")
                .queryParam("currentPassword", "ABC")
                .queryParam("newPassword", "XYZ")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void changePasswordWithoutCurrentPasswordTest() throws Exception {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("newPassword", "XYZ")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());

        ObjectNode responseObject = getResponse(response);
        assertEquals("MobiException", responseObject.get("error").asText());
        assertEquals("Current password must be provided", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void changePasswordWithWrongPasswordTest() throws Exception {
        // Setup:
        when(engineManager.checkPassword(anyString(), anyString(), eq("error"))).thenReturn(false);

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("currentPassword", "error")
                .queryParam("newPassword", "XYZ")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());

        ObjectNode responseObject = getResponse(response);
        assertEquals("MobiException", responseObject.get("error").asText());
        assertEquals("Current password is wrong", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void changePasswordWithoutNewPasswordTest() throws Exception {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("currentPassword", "ABC")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());

        ObjectNode responseObject = getResponse(response);
        assertEquals("MobiException", responseObject.get("error").asText());
        assertEquals("New password must be provided", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void changePasswordForUserThatDoesNotExistTest() throws Exception {
        // Setup:
        when(engineManager.retrieveUser(ENGINE_NAME, UsernameTestFilter.USERNAME)).thenReturn(Optional.empty());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/password")
                .queryParam("currentPassword", "ABC")
                .queryParam("newPassword", "XYZ")
                .request().post(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());

        ObjectNode responseObject = getResponse(response);
        assertEquals("MobiException", responseObject.get("error").asText());
        assertEquals("User tester not found", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void resetPasswordTest() {
        Response response = target().path("users/username/password")
                .queryParam("newPassword", "XYZ")
                .request().put(Entity.entity("user", MediaType.MULTIPART_FORM_DATA));
        assertEquals(200, response.getStatus());
        verify(engineManager, atLeastOnce()).retrieveUser(ENGINE_NAME, "username");
        verify(engineManager).updateUser(eq(ENGINE_NAME), any(User.class));
    }

    @Test
    public void resetPasswordWithoutNewPasswordTest() {
        Response response = target().path("users/username/password")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void resetPasswordOfUserThatDoesNotExistTest() throws Exception {
        Response response = target().path("users/error/password")
                .queryParam("newPassword", "XYZ")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
        ObjectNode responseObject = getResponse(response);
        assertEquals("MobiException", responseObject.get("error").asText());
        assertEquals("User error not found", responseObject.get("errorMessage").asText());
        assertNotEquals(responseObject.get("errorDetails"), null);
    }

    @Test
    public void deleteUserTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME).request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager).deleteUser(ENGINE_NAME, UsernameTestFilter.USERNAME);
        verify(commitManager).getInProgressCommits(eq(user), any(RepositoryConnection.class));
        verify(commitManager).removeInProgressCommit(eq(inProgressCommitIRI1), any(RepositoryConnection.class));
        verify(commitManager).removeInProgressCommit(eq(inProgressCommitIRI2), any(RepositoryConnection.class));
        verify(stateManager).getStates(eq(UsernameTestFilter.USERNAME), eq(null), any(Set.class));
        verify(stateManager).deleteState(eq(stateIRI));
    }

    @Test
    public void deleteUserNoInProgressCommitsTest() {
        when(commitManager.getInProgressCommits(eq(user), any(RepositoryConnection.class))).thenReturn(new ArrayList<>());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME).request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager).deleteUser(ENGINE_NAME, UsernameTestFilter.USERNAME);
        verify(commitManager).getInProgressCommits(eq(user), any(RepositoryConnection.class));
        verify(commitManager, never()).removeInProgressCommit(any(Resource.class), any(RepositoryConnection.class));
        verify(stateManager).getStates(eq(UsernameTestFilter.USERNAME), eq(null), any(Set.class));
        verify(stateManager).deleteState(eq(stateIRI));
    }

    @Test
    public void deleteUserNoStatesTest() {
        when(stateManager.getStates(eq(UsernameTestFilter.USERNAME), eq(null), any(Set.class))).thenReturn(Collections.emptyMap());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME).request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager).deleteUser(ENGINE_NAME, UsernameTestFilter.USERNAME);
        verify(commitManager).getInProgressCommits(eq(user), any(RepositoryConnection.class));
        verify(commitManager).removeInProgressCommit(eq(inProgressCommitIRI1), any(RepositoryConnection.class));
        verify(commitManager).removeInProgressCommit(eq(inProgressCommitIRI2), any(RepositoryConnection.class));
        verify(stateManager).getStates(eq(UsernameTestFilter.USERNAME), eq(null), any(Set.class));
        verify(stateManager, never()).deleteState(eq(stateIRI));
    }

    @Test
    public void deleteUserThatDoesNotExistTest() {
        //Setup:
        when(engineManager.userExists("error")).thenReturn(false);

        Response response = target().path("users/error").request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void deleteMasterAdminUserTest() {
        when(engineManager.retrieveUser("admin")).thenReturn(Optional.of(adminUserMock));
        when(adminUserMock.getResource()).thenReturn(vf.createIRI(UserRest.ADMIN_USER_IRI));
        Response response = target().path("users/" + UsernameTestFilter.ADMIN_USER).request().delete();
        assertEquals(405, response.getStatus());
    }

    @Test
    public void getUserRolesTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").request().get();
        verify(engineManager).retrieveUser(UsernameTestFilter.USERNAME);
        assertEquals(200, response.getStatus());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(result.size(), roles.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getUserRolesIncludingGroupsTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("includeGroups", "true").request().get();
        verify(engineManager).retrieveUser(UsernameTestFilter.USERNAME);
        assertEquals(200, response.getStatus());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(result.size(), roles.size() + group.getHasGroupRole().size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getUserRolesThatDoNotExistTest() {
        Response response = target().path("users/error/roles").request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void addUserRolesTest() {
        // Setup:
        Map<String, Role> roles = IntStream.range(1, 3)
                .mapToObj(Integer::toString)
                .collect(Collectors.toMap(s -> s, s -> roleFactory.createNew(vf.createIRI("http://mobi.com/roles/" + s))));
        User newUser = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME));
        newUser.setHasUserRole(Collections.singleton(role));
        when(engineManager.getRole( anyString())).thenAnswer(i -> Optional.of(roles.get(i.getArgument(0, String.class))));
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(newUser));

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("roles", roles.keySet().toArray())
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(UsernameTestFilter.USERNAME);
        roles.keySet().forEach(s -> verify(engineManager).getRole(s));
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(engineManager).updateUser(captor.capture());
        User updatedUser = captor.getValue();
        assertEquals(user.getResource(), updatedUser.getResource());
        Set<Resource> updatedRoles = updatedUser.getHasUserRole_resource();
        assertEquals(roles.size() + 1, updatedRoles.size());
        assertTrue(updatedRoles.contains(role.getResource()));
        roles.values().forEach(role -> assertTrue(updatedRoles.contains(role.getResource())));
    }

    @Test
    public void addRolesToUserThatDoesNotExistTest() {
        //Setup:
        String[] roles = {"testRole"};

        Response response = target().path("users/error/roles").queryParam("roles", roles)
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void addRolesThatDoNotExistToUserTest() {
        //Setup:
        when(engineManager.getRole(anyString())).thenReturn(Optional.empty());
        String[] roles = {"testRole"};

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("roles", roles)
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void addUserRolesWithoutRolesTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeUserRoleTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("role", "testRole")
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(UsernameTestFilter.USERNAME);
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(engineManager).updateUser(captor.capture());
        User updatedUser = captor.getValue();
        assertEquals(user.getResource(), updatedUser.getResource());
        assertEquals(0, updatedUser.getHasUserRole_resource().size());
    }

    @Test
    public void removeAdminRoleFromAdminTest() {
        when(engineManager.retrieveUser("admin")).thenReturn(Optional.of(adminUserMock));
        when(engineManager.getRole(eq("admin"))).thenReturn(Optional.of(adminRole));
        when(adminUserMock.getResource()).thenReturn(vf.createIRI(UserRest.ADMIN_USER_IRI));
        Response response = target().path("users/" + UsernameTestFilter.ADMIN_USER + "/roles")
                .queryParam("role", "admin")
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeRoleFromUserThatDoesNotExistTest() {
        Response response = target().path("users/error/roles").queryParam("role", "testRole")
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeRoleThatDoesNotExistFromUserTest() {
        //Setup:
        when(engineManager.getRole(anyString())).thenReturn(Optional.empty());

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/roles").queryParam("role", "error")
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getUserGroupsTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/groups").request().get();
        assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(UsernameTestFilter.USERNAME);
        verify(engineManager).getGroups();
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(result.size(), groups.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void addUserGroupTest() {
        // Setup:
        Group newGroup = groupFactory.createNew(vf.createIRI("http://mobi.com/groups/anothergroup"));
        when(engineManager.retrieveGroup("anothergroup")).thenReturn(Optional.of(newGroup));

        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/groups").queryParam("group", "anothergroup")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(UsernameTestFilter.USERNAME);
        verify(engineManager).retrieveGroup("anothergroup");
        ArgumentCaptor<Group> captor = ArgumentCaptor.forClass(Group.class);
        verify(engineManager).updateGroup(captor.capture());
        Group updatedGroup = captor.getValue();
        assertEquals(newGroup.getResource(), updatedGroup.getResource());
        Set<Resource> updatedMembers = updatedGroup.getMember_resource();
        assertEquals(1, updatedMembers.size());
        assertTrue(updatedMembers.contains(user.getResource()));
    }

    @Test
    public void addGroupToUserThatDoesNotExistTest() {
        Response response = target().path("users/error/groups").queryParam("group", "testGroup")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void addGroupThatDoesNotExistToUserTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/groups").queryParam("group", "error")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeUserGroupTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/groups").queryParam("group", "testGroup")
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(engineManager).retrieveUser(UsernameTestFilter.USERNAME);
        verify(engineManager).retrieveGroup(ENGINE_NAME, "testGroup");
        ArgumentCaptor<Group> captor = ArgumentCaptor.forClass(Group.class);
        verify(engineManager).updateGroup(eq(ENGINE_NAME), captor.capture());
        Group updatedGroup = captor.getValue();
        assertEquals(group.getResource(), updatedGroup.getResource());
        assertEquals(0, updatedGroup.getMember_resource().size());
    }

    @Test
    public void removeGroupFromUserThatDoesNotExistTest() {
        Response response = target().path("users/error/groups").queryParam("group", "testGroup")
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeGroupThatDoesNotExistFromUserTest() {
        Response response = target().path("users/" + UsernameTestFilter.USERNAME + "/groups").queryParam("group", "error")
                .request().delete();
        assertEquals(400, response.getStatus());
    }


    private ObjectNode getResponse(Response response) throws Exception {
        return mapper.readValue(response.readEntity(String.class), ObjectNode.class);
    }

}
