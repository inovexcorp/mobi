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
import org.apache.karaf.jaas.boot.principal.GroupPrincipal;
import org.apache.karaf.jaas.boot.principal.RolePrincipal;
import org.apache.karaf.jaas.boot.principal.UserPrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.apache.karaf.jaas.modules.BackingEngine;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Assert;
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
import java.util.*;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.*;

public class GroupRestImplTest extends MatontoRestTestNg {
    private GroupRestImpl rest;
    private Map<GroupPrincipal, String> groups;
    private List<UserPrincipal> users;
    private List<GroupPrincipal> userGroups;
    private List<RolePrincipal> roles;

    @Mock
    JaasRealm realm;

    @Mock
    BackingEngine engine;

    @Mock
    TokenBackingEngineFactory factory;

    @Override
    protected Application configureApp() throws Exception {
        groups = new HashMap<>();
        groups.put(new GroupPrincipal("testGroup"), "");
        users = Collections.singletonList(new UserPrincipal("testUser"));
        userGroups = Collections.singletonList(new GroupPrincipal("testGroup"));
        roles = Collections.singletonList(new RolePrincipal("testRole"));
        MockitoAnnotations.initMocks(this);
        rest = spy(new GroupRestImpl());
        rest.setRealm(realm);

        when(rest.getFactory()).thenReturn(factory);
        when(factory.build(any(Map.class))).thenReturn(engine);
        when(realm.getEntries()).thenReturn(new AppConfigurationEntry[] {
                new AppConfigurationEntry("loginModule", AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL,
                        new HashMap<>()),
                new AppConfigurationEntry("loginModule", AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL,
                        new HashMap<>())});
        when(engine.listUsers()).thenReturn(users);
        when(engine.listGroups(any(UserPrincipal.class))).thenReturn(userGroups);
        when(engine.listGroups()).thenReturn(groups);
        when(engine.listRoles(any(Principal.class))).thenReturn(roles);
        doNothing().when(engine).createGroup(anyString());
        doNothing().when(engine).addGroupRole(anyString(), anyString());
        doNothing().when(engine).deleteGroup(anyString(), anyString());
        doNothing().when(engine).deleteGroupRole(anyString(), anyString());

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
        Response response = target().path("groups").queryParam("name", "testGroup1")
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        verify(engine).createGroup("testGroup1");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("groups")
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());

        response = target().path("groups").queryParam("name", "testGroup")
                .request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getGroupTest() {
        Response response = target().path("groups/testGroup").request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.get("name").equals("testGroup"));
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("groups/error").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void deleteGroupTest() {
        Response response = target().path("groups/testGroup").request().delete();
        Assert.assertEquals(200, response.getStatus());

        response = target().path("groups/error").request().delete();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void getGroupRolesTest() {
        Response response = target().path("groups/testGroup/roles").request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            Assert.assertTrue(result.size() == roles.size());
        } catch (Exception e) {
            Assert.fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("groups/error/roles").request().get();
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void addGroupRoleTest() {
        Response response = target().path("groups/testGroup/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        verify(engine).addGroupRole("testGroup", "testRole");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("groups/error/roles").queryParam("role", "testRole")
                .request().put(Entity.entity("", MediaType.MULTIPART_FORM_DATA));
        Assert.assertEquals(400, response.getStatus());
    }

    @Test
    public void removeGroupRoleTest() {
        Response response = target().path("groups/testGroup/roles").queryParam("role", "testRole")
                .request().delete();
        verify(engine).deleteGroupRole("testGroup", "testRole");
        Assert.assertEquals(200, response.getStatus());

        response = target().path("groups/error/roles").queryParam("role", "testRole")
                .request().delete();
        Assert.assertEquals(400, response.getStatus());
    }
}
