package org.matonto.jaas.engines;

/*-
 * #%L
 * org.matonto.jaas
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


import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.matonto.jaas.api.engines.Engine;
import org.matonto.jaas.api.engines.GroupConfig;
import org.matonto.jaas.api.engines.UserConfig;
import org.matonto.jaas.api.ontologies.usermanagement.Group;
import org.matonto.jaas.api.ontologies.usermanagement.Role;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

public class SimpleEngineManagerTest {
    private SimpleEngineManager engineManager;

    @Mock
    Engine engine;

    @Mock
    User user;

    @Mock
    Group group;

    @Mock
    Role role;

    @Mock
    UserConfig userConfig;

    @Mock
    GroupConfig groupConfig;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);

        when(engine.getUsers()).thenReturn(Stream.of(user).collect(Collectors.toSet()));
        when(engine.getGroups()).thenReturn(Stream.of(group).collect(Collectors.toSet()));
        when(engine.createUser(any(UserConfig.class))).thenReturn(user);
        when(engine.createGroup(any(GroupConfig.class))).thenReturn(group);
        when(engine.storeUser(any(User.class))).thenReturn(true);
        when(engine.storeGroup(any(Group.class))).thenReturn(true);
        when(engine.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(engine.retrieveGroup(anyString())).thenReturn(Optional.of(group));
        when(engine.deleteUser(anyString())).thenReturn(true);
        when(engine.deleteGroup(anyString())).thenReturn(true);
        when(engine.updateUser(any(User.class))).thenReturn(true);
        when(engine.updateGroup(any(Group.class))).thenReturn(true);
        when(engine.userExists(anyString())).thenReturn(true);
        when(engine.groupExists(anyString())).thenReturn(true);
        when(engine.getUserRoles(anyString())).thenReturn(Stream.of(role).collect(Collectors.toSet()));
        when(engine.checkPassword(anyString(), anyString())).thenReturn(true);

        engineManager = new SimpleEngineManager();
        engineManager.addEngine(engine);
    }

    @Test
    public void testContainsEngine() throws Exception {
        boolean result = engineManager.containsEngine(engine.getClass().getName());
        Assert.assertTrue(result);

        result = engineManager.containsEngine("error");
        Assert.assertFalse(result);
    }

    @Test
    public void testGetUsers() throws Exception {
        Set<User> users = engineManager.getUsers("error");
        Mockito.verify(engine, times(0)).getUsers();
        Assert.assertTrue(users.isEmpty());

        users = engineManager.getUsers(engine.getClass().getName());
        Mockito.verify(engine, times(1)).getUsers();
        Assert.assertTrue(users.size() == 1);
    }

    @Test
    public void testCreateUser() throws Exception {
        User result = engineManager.createUser("error", userConfig);
        Mockito.verify(engine, times(0)).createUser(userConfig);
        Assert.assertTrue(result == null);

        result = engineManager.createUser(engine.getClass().getName(), userConfig);
        Mockito.verify(engine, times(1)).createUser(userConfig);
        Assert.assertTrue(result != null && result.equals(user));
    }

    @Test
    public void testStoreUser() throws Exception {
        boolean result = engineManager.storeUser("error", user);
        Mockito.verify(engine, times(0)).storeUser(user);
        Assert.assertFalse(result);

        result = engineManager.storeUser(engine.getClass().getName(), user);
        Mockito.verify(engine, times(1)).storeUser(user);
        Assert.assertTrue(result);
    }

    @Test
    public void testRetrieveUser() throws Exception {
        Optional<User> result = engineManager.retrieveUser("error", "user");
        Mockito.verify(engine, times(0)).retrieveUser("user");
        Assert.assertFalse(result.isPresent());

        result = engineManager.retrieveUser(engine.getClass().getName(), "user");
        Mockito.verify(engine, times(1)).retrieveUser("user");
        Assert.assertTrue(result.isPresent() && result.get().equals(user));
    }

    @Test
    public void testDeleteUser() throws Exception {
        boolean result = engineManager.deleteUser("error", "user");
        Mockito.verify(engine, times(0)).deleteUser("user");
        Assert.assertFalse(result);

        result = engineManager.deleteUser(engine.getClass().getName(), "user");
        Mockito.verify(engine, times(1)).deleteUser("user");
        Assert.assertTrue(result);
    }

    @Test
    public void testUpdateUser() throws Exception {
        boolean result = engineManager.updateUser("error", user);
        Mockito.verify(engine, times(0)).updateUser(user);
        Assert.assertFalse(result);

        result = engineManager.updateUser(engine.getClass().getName(), user);
        Mockito.verify(engine, times(1)).updateUser(user);
        Assert.assertTrue(result);
    }

    @Test
    public void testUserExistsInOneEngine() throws Exception {
        boolean result = engineManager.userExists("error", "user");
        Mockito.verify(engine, times(0)).userExists("user");
        Assert.assertFalse(result);

        result = engineManager.userExists(engine.getClass().getName(), "user");
        Mockito.verify(engine, times(1)).userExists("user");
        Assert.assertTrue(result);
    }

    @Test
    public void testUserExistsInAllEngines() throws Exception {
        boolean result = engineManager.userExists("user");
        Mockito.verify(engine, times(1)).userExists("user");
        Assert.assertTrue(result);

        when(engine.userExists(anyString())).thenReturn(false);
        result = engineManager.userExists("user");
        Mockito.verify(engine, times(2)).userExists("user");
        Assert.assertFalse(result);
    }

    @Test
    public void testGetGroups() throws Exception {
        Set<Group> groups = engineManager.getGroups("error");
        Mockito.verify(engine, times(0)).getGroups();
        Assert.assertTrue(groups.isEmpty());

        groups = engineManager.getGroups(engine.getClass().getName());
        Mockito.verify(engine, times(1)).getGroups();
        Assert.assertTrue(groups.size() == 1);
    }

    @Test
    public void testCreateGroup() throws Exception {
        Group result = engineManager.createGroup("error", groupConfig);
        Mockito.verify(engine, times(0)).createGroup(groupConfig);
        Assert.assertTrue(result == null);

        result = engineManager.createGroup(engine.getClass().getName(), groupConfig);
        Mockito.verify(engine, times(1)).createGroup(groupConfig);
        Assert.assertTrue(result != null && result.equals(group));
    }

    @Test
    public void testStoreGroup() throws Exception {
        boolean result = engineManager.storeGroup("error", group);
        Mockito.verify(engine, times(0)).storeGroup(group);
        Assert.assertFalse(result);

        result = engineManager.storeGroup(engine.getClass().getName(), group);
        Mockito.verify(engine, times(1)).storeGroup(group);
        Assert.assertTrue(result);
    }

    @Test
    public void testRetrieveGroup() throws Exception {
        Optional<Group> result = engineManager.retrieveGroup("error", "group");
        Mockito.verify(engine, times(0)).retrieveGroup("group");
        Assert.assertFalse(result.isPresent());

        result = engineManager.retrieveGroup(engine.getClass().getName(), "group");
        Mockito.verify(engine, times(1)).retrieveGroup("group");
        Assert.assertTrue(result.isPresent() && result.get().equals(group));
    }

    @Test
    public void testDeleteGroup() throws Exception {
        boolean result = engineManager.deleteGroup("error", "group");
        Mockito.verify(engine, times(0)).deleteGroup("group");
        Assert.assertFalse(result);

        result = engineManager.deleteGroup(engine.getClass().getName(), "group");
        Mockito.verify(engine, times(1)).deleteGroup("group");
        Assert.assertTrue(result);
    }

    @Test
    public void testUpdateGroup() throws Exception {
        boolean result = engineManager.updateGroup("error", group);
        Mockito.verify(engine, times(0)).updateGroup(group);
        Assert.assertFalse(result);

        result = engineManager.updateGroup(engine.getClass().getName(), group);
        Mockito.verify(engine, times(1)).updateGroup(group);
        Assert.assertTrue(result);
    }

    @Test
    public void testGroupExistsInOneEngine() throws Exception {
        boolean result = engineManager.groupExists("error", "group");
        Mockito.verify(engine, times(0)).groupExists("group");
        Assert.assertFalse(result);

        result = engineManager.groupExists(engine.getClass().getName(), "group");
        Mockito.verify(engine, times(1)).groupExists("group");
        Assert.assertTrue(result);
    }

    @Test
    public void testGroupExistsInAllEngines() throws Exception {
        boolean result = engineManager.groupExists("group");
        Mockito.verify(engine, times(1)).groupExists("group");
        Assert.assertTrue(result);

        when(engine.groupExists(anyString())).thenReturn(false);
        result = engineManager.groupExists("group");
        Mockito.verify(engine, times(2)).groupExists("group");
        Assert.assertFalse(result);
    }

    @Test
    public void testGetUserRolesInOneEngine() throws Exception {
        Set<Role> roles = engineManager.getUserRoles("error", "user");
        Mockito.verify(engine, times(0)).getUserRoles("user");
        Assert.assertTrue(roles.isEmpty());

        roles = engineManager.getUserRoles(engine.getClass().getName(), "user");
        Mockito.verify(engine, times(1)).getUserRoles("user");
        Assert.assertTrue(roles.size() == 1);
    }

    @Test
    public void testGetUserRolesInAllEngines() throws Exception {
        Set<Role> roles = engineManager.getUserRoles("user");
        Mockito.verify(engine, times(1)).getUserRoles("user");
        Assert.assertTrue(roles.size() == 1);
    }

    @Test
    public void testCheckPassword() throws Exception {
        boolean result = engineManager.checkPassword("error", "user", "password");
        Mockito.verify(engine, times(0)).checkPassword("user", "password");
        Assert.assertFalse(result);

        result = engineManager.checkPassword(engine.getClass().getName(), "user", "password");
        Mockito.verify(engine, times(1)).checkPassword("user", "password");
        Assert.assertTrue(result);
    }
}
