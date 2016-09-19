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
import org.apache.karaf.jaas.boot.ProxyLoginModule;
import org.apache.karaf.jaas.boot.principal.GroupPrincipal;
import org.apache.karaf.jaas.boot.principal.RolePrincipal;
import org.apache.karaf.jaas.boot.principal.UserPrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Assert;
import org.matonto.jaas.modules.token.TokenBackingEngine;
import org.matonto.jaas.modules.token.TokenBackingEngineFactory;
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.Test;

import javax.security.auth.login.AppConfigurationEntry;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.security.Principal;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class UserRestImplTest extends MatontoRestTestNg {
    private UserRestImpl rest;
    private List<UserPrincipal> users;
    private List<GroupPrincipal> groups;
    private List<RolePrincipal> roles;

    @Mock
    JaasRealm realm;

    @Mock
    TokenBackingEngine engine;

    @Mock
    TokenBackingEngineFactory factory;

    @Override
    protected Application configureApp() throws Exception {
        users = Collections.singletonList(new UserPrincipal("testUser"));
        groups = Collections.singletonList(new GroupPrincipal("testGroup"));
        roles = Collections.singletonList(new RolePrincipal("testRole"));
        MockitoAnnotations.initMocks(this);
        rest = spy(new UserRestImpl());
        rest.setRealm(realm);

        Map<String, Object> tokenOptions = new HashMap<>();
        tokenOptions.put(ProxyLoginModule.PROPERTY_MODULE, UserRestImpl.TOKEN_MODULE);

        when(factory.getModuleClass()).thenReturn(UserRestImpl.TOKEN_MODULE);
        when(factory.build(any(Map.class))).thenReturn(engine);
        when(realm.getEntries()).thenReturn(new AppConfigurationEntry[] {
                new AppConfigurationEntry("loginModule", AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL,
                        tokenOptions),
                new AppConfigurationEntry("loginModule", AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL,
                        new HashMap<>())});
        when(engine.listUsers()).thenReturn(users);
        when(engine.listGroups(any(UserPrincipal.class))).thenReturn(groups);
        when(engine.listRoles(any(Principal.class))).thenReturn(roles);
        doNothing().when(engine).addUser(anyString(), anyString());
        doNothing().when(engine).addGroup(anyString(), anyString());
        doNothing().when(engine).addRole(anyString(), anyString());
        doNothing().when(engine).deleteUser(anyString());
        doNothing().when(engine).deleteGroup(anyString(), anyString());
        doNothing().when(engine).deleteRole(anyString(), anyString());
        doReturn(true).when(rest).isAuthorizedUser(any(), any());

        rest.addEngineFactory(factory);

        rest.start();

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @Test
    public void listUsersTest() {
        Response response = target().path("users").request().get();
        verify(engine, atLeastOnce()).listUsers();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.size() == users.size());
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createUserTest() {
        Response response = target().path("users")
                .queryParam("username", "testUser1").queryParam("password", "123")
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        verify(engine).addUser("testUser1", "123");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("users")
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
        Assert.assertTrue(response.readEntity(String.class).contains("testUser"));

        response = target().path("users/error").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUserTest() {
        doReturn(true).when(rest).validPassword("testUser", "ABC");

        Response response = target().path("users/testUser")
                .queryParam("currentPassword", "ABC")
                .queryParam("newPassword", "XYZ")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        verify(engine).addUser("testUser", "XYZ");

        response = target().path("users/testUser")
                .queryParam("username", "testUser1")
                .queryParam("currentPassword", "ABC")
                .queryParam("newPassword", "XYZ")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        verify(engine).addUser("testUser1", "XYZ");
        verify(engine, atLeastOnce()).listGroups(any(UserPrincipal.class));
        verify(engine, atLeastOnce()).listRoles(any(UserPrincipal.class));
        verify(engine, atLeastOnce()).deleteUser("testUser");
        verify(engine, times(groups.size())).addGroup(eq("testUser1"), anyString());
        verify(engine, times(roles.size())).addRole(eq("testUser1"), anyString());
    }

    @Test
    public void updateUserWithoutCurrentPasswordReturns401() {
        Response response = target().path("users/testUser")
                .queryParam("newPassword", "XYZ")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUserNoChange() {
        doReturn(true).when(rest).validPassword("testUser", "ABC");

        Response response = target().path("users/testUser")
                .queryParam("currentPassword", "ABC")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        verify(engine).addUser("testUser", "ABC");
    }

    @Test
    public void updateUserChangeUsername() {
        doReturn(true).when(rest).validPassword("testUser", "ABC");

        Response response = target().path("users/testUser")
                .queryParam("username", "testUser2")
                .queryParam("currentPassword", "ABC")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(200, response.getStatus());
        verify(engine).addUser("testUser2", "ABC");
        verify(engine, atLeastOnce()).listGroups(any(UserPrincipal.class));
        verify(engine, atLeastOnce()).listRoles(any(UserPrincipal.class));
        verify(engine, atLeastOnce()).deleteUser("testUser");
        verify(engine, times(groups.size())).addGroup(eq("testUser2"), anyString());
        verify(engine, times(roles.size())).addRole(eq("testUser2"), anyString());
    }

    @Test
    public void deleteUserTest() {
        Response response = target().path("users/testUser").request().delete();
        verify(engine).deleteUser("testUser");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("users/error").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getUserRolesTest() {
        Response response = target().path("users/testUser/roles").request().get();
        verify(engine).listRoles(any(UserPrincipal.class));
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.size() == roles.size());
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("users/error/roles").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void addUserRoleTest() {
        Response response = target().path("users/testUser/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        verify(engine).addRole("testUser", "testRole");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("users/error/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void removeUserRoleTest() {
        Response response = target().path("users/testUser/roles").queryParam("role", "testRole")
                .request().delete();
        verify(engine).deleteRole("testUser", "testRole");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("users/error/roles").queryParam("role", "testRole")
                .request().delete();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getUserGroupsTest() {
        Response response = target().path("users/testUser/groups").request().get();
        verify(engine).listGroups(any(UserPrincipal.class));
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.size() == roles.size());
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("users/error/groups").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void addUserGroupTest() {
        Response response = target().path("users/testUser/groups").queryParam("group", "testGroup")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        verify(engine).addGroup("testUser", "testGroup");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("users/error/groups").queryParam("group", "testGroup")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void removeUserGroupTest() {
        Response response = target().path("users/testUser/groups").queryParam("group", "testGroup")
                .request().delete();
        verify(engine).deleteGroup("testUser", "testGroup");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("users/error/groups").queryParam("group", "testGroup")
                .request().delete();
        Assert.assertEquals(400, response.getStatus());
    }
}
