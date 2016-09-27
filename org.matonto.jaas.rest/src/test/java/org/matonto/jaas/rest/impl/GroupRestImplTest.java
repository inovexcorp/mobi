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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class GroupRestImplTest extends MatontoRestTestNg {
    private GroupRestImpl rest;
    private Map<GroupPrincipal, String> groups;
    private List<UserPrincipal> users;
    private List<GroupPrincipal> admin1Groups;
    private List<GroupPrincipal> user1Groups;
    private List<RolePrincipal> roles;

    @Mock
    JaasRealm realm;

    @Mock
    TokenBackingEngine engine;

    @Mock
    TokenBackingEngineFactory factory;

    @Override
    protected Application configureApp() throws Exception {
        MockitoAnnotations.initMocks(this);

        // Setup groups
        GroupPrincipal testGroup1 = new GroupPrincipal("testGroup1");
        GroupPrincipal testGroup2 = new GroupPrincipal("testGroup2");
        GroupPrincipal testGroup3 = new GroupPrincipal("testGroup3");
        groups = new HashMap<>();
        groups.put(testGroup1, "admin,user");
        groups.put(testGroup2, "user");
        groups.put(testGroup3, "");

        // Setup users
        UserPrincipal admin1 = new UserPrincipal("admin1");
        UserPrincipal user1 = new UserPrincipal("user1");
        users = new ArrayList<>();
        users.add(admin1);
        users.add(user1);

        admin1Groups = Collections.singletonList(testGroup1);
        user1Groups = new ArrayList<>();
        user1Groups.add(testGroup1);
        user1Groups.add(testGroup2);

        // Setup roles
        RolePrincipal adminRole = new RolePrincipal("admin");
        RolePrincipal userRole = new RolePrincipal("user");
        roles = new ArrayList<>();
        roles.add(adminRole);
        roles.add(userRole);

        when(engine.listGroups()).thenReturn(groups);
        when(engine.listUsers()).thenReturn(users);
        when(engine.listGroups(admin1)).thenReturn(admin1Groups);
        when(engine.listGroups(user1)).thenReturn(user1Groups);
        doNothing().when(engine).createGroup(anyString());
        doNothing().when(engine).addGroupRole(anyString(), anyString());
        doNothing().when(engine).deleteGroup(anyString(), anyString());
        doNothing().when(engine).deleteGroupRole(anyString(), anyString());

        // Setup realm and factory
        Map<String, Object> tokenOptions = new HashMap<>();
        tokenOptions.put(ProxyLoginModule.PROPERTY_MODULE, UserRestImpl.TOKEN_MODULE);

        when(factory.getModuleClass()).thenReturn(UserRestImpl.TOKEN_MODULE);
        when(factory.build(any(Map.class))).thenReturn(engine);
        when(realm.getEntries()).thenReturn(new AppConfigurationEntry[] {
                new AppConfigurationEntry("loginModule", AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL,
                        tokenOptions),
                new AppConfigurationEntry("loginModule", AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL,
                        new HashMap<>())});

        // Setup rest
        rest = spy(new GroupRestImpl());
        rest.setRealm(realm);
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
    public void listGroupsTest() {
        Response response = target().path("groups").request().get();
        verify(engine, atLeastOnce()).listGroups();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.size() == groups.size());
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createGroupTest() {
        String existingGroup = "testGroup1";
        String newGroup = "testGroup4";

        Response response = target().path("groups").queryParam("name", newGroup)
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        verify(engine).createGroup(newGroup);
        Assert.assertEquals(200, response.getStatus());

        response = target().path("groups")
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());

        response = target().path("groups").queryParam("name", existingGroup)
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getGroupTest() {
        String existingGroup = "testGroup1";

        Response response = target().path("groups/" + existingGroup).request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.get("name").equals(existingGroup));
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("groups/error").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void deleteGroupTest() {
        String existingGroup = "testGroup1";

        Response response = target().path("groups/" + existingGroup).request().delete();
        Assert.assertEquals(200, response.getStatus());

        response = target().path("groups/error").request().delete();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getGroupRolesTest() {
        String existingGroup = "testGroup1";

        Response response = target().path("groups/" + existingGroup + "/roles").request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            Assert.assertEquals(roles.size(), result.size());
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("groups/error/roles").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void addGroupRoleTest() {
        String existingGroup = "testGroup1";

        Response response = target().path("groups/" + existingGroup + "/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        verify(engine).addGroupRole(existingGroup, "testRole");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("groups/error/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void removeGroupRoleTest() {
        String existingGroup = "testGroup1";

        Response response = target().path("groups/" + existingGroup + "/roles").queryParam("role", "testRole")
                .request().delete();
        verify(engine).deleteGroupRole(existingGroup, "testRole");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("groups/error/roles").queryParam("role", "testRole")
                .request().delete();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getGroupUsersTest() {
        Response response = target().path("groups/testGroup1/users").request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.size() == 2);
            Assert.assertTrue(result.contains("admin1"));
            Assert.assertTrue(result.contains("user1"));
            Assert.assertFalse(result.contains("user2"));
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("groups/testGroup2/users").request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.size() == 1);
            Assert.assertTrue(result.contains("user1"));
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("groups/testGroup3/users").request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.size() == 0);
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("groups/error/users").request().get();
        Assert.assertEquals(400, response.getStatus());
    }
}
