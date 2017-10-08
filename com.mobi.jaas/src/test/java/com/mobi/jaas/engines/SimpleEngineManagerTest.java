package com.mobi.jaas.engines;

/*-
 * #%L
 * com.mobi.jaas
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


import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.junit.Before;
import org.junit.Test;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static junit.framework.TestCase.*;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

public class SimpleEngineManagerTest {
    private SimpleEngineManager engineManager;
    private ValueFactory vf = SimpleValueFactory.getInstance();

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

        when(engine.getRole(anyString())).thenReturn(Optional.of(role));
        when(engine.getUsers()).thenReturn(Collections.singleton(user));
        when(engine.getGroups()).thenReturn(Collections.singleton(group));
        when(engine.createUser(any(UserConfig.class))).thenReturn(user);
        when(engine.createGroup(any(GroupConfig.class))).thenReturn(group);
        when(engine.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(engine.retrieveGroup(anyString())).thenReturn(Optional.of(group));
        when(engine.userExists(anyString())).thenReturn(true);
        when(engine.groupExists(anyString())).thenReturn(true);
        when(engine.getUserRoles(anyString())).thenReturn(Collections.singleton(role));
        when(engine.checkPassword(anyString(), anyString())).thenReturn(true);
        when(user.getResource()).thenReturn(vf.createIRI("http://mobi.com/users/tester"));
        when(user.getUsername()).thenReturn(Optional.of(vf.createLiteral("tester")));

        engineManager = new SimpleEngineManager();
        engineManager.addEngine(engine);
    }

    @Test
    public void testContainsEngine() throws Exception {
        boolean result = engineManager.containsEngine(engine.getClass().getName());
        assertTrue(result);

        result = engineManager.containsEngine("error");
        assertFalse(result);
    }
    
    @Test
    public void testGetRole() throws Exception {
        Optional<Role> roleOptional = engineManager.getRole("error", "role");
        verify(engine, times(0)).getRole("role");
        assertFalse(roleOptional.isPresent());

        roleOptional = engineManager.getRole(engine.getClass().getName(), "role");
        verify(engine).getRole("role");
        assertTrue(roleOptional.isPresent());
        assertEquals(roleOptional.get(), role);
    }

    @Test
    public void testGetUsersForEngine() throws Exception {
        Set<User> users = engineManager.getUsers("error");
        verify(engine, times(0)).getUsers();
        assertTrue(users.isEmpty());

        users = engineManager.getUsers(engine.getClass().getName());
        verify(engine).getUsers();
        assertEquals(1, users.size());
    }

    @Test
    public void testGetUsersForAllEngines() throws Exception {
        Set<User> users = engineManager.getUsers();
        verify(engine).getUsers();
        assertEquals(1, users.size());
    }

    @Test
    public void testCreateUser() throws Exception {
        User result = engineManager.createUser("error", userConfig);
        verify(engine, times(0)).createUser(userConfig);
        assertNull(result);

        result = engineManager.createUser(engine.getClass().getName(), userConfig);
        verify(engine).createUser(userConfig);
        assertNotNull(result);
        assertEquals(user, result);
    }

    @Test
    public void testStoreUser() throws Exception {
        engineManager.storeUser("error", user);
        verify(engine, times(0)).storeUser(user);

        engineManager.storeUser(engine.getClass().getName(), user);
        verify(engine).storeUser(user);
    }

    @Test
    public void testRetrieveUserFromEngine() throws Exception {
        Optional<User> result = engineManager.retrieveUser("error", "user");
        verify(engine, times(0)).retrieveUser("user");
        assertFalse(result.isPresent());

        result = engineManager.retrieveUser(engine.getClass().getName(), "user");
        verify(engine).retrieveUser("user");
        assertTrue(result.isPresent());
        assertEquals(user, result.get());
    }

    @Test
    public void testRetrieveUser() throws Exception {
        // Setup:
        when(engine.retrieveUser("error")).thenReturn(Optional.empty());

        Optional<User> result = engineManager.retrieveUser("error");
        verify(engine).retrieveUser("error");
        assertFalse(result.isPresent());

        result = engineManager.retrieveUser("user");
        verify(engine).retrieveUser("user");
        assertTrue(result.isPresent());
        assertEquals(user, result.get());
    }

    @Test
    public void testDeleteUser() throws Exception {
        engineManager.deleteUser("error", "user");
        verify(engine, times(0)).deleteUser("user");

        engineManager.deleteUser(engine.getClass().getName(), "user");
        verify(engine).deleteUser("user");
    }

    @Test
    public void testUpdateUser() throws Exception {
        engineManager.updateUser("error", user);
        verify(engine, times(0)).updateUser(user);

        engineManager.updateUser(engine.getClass().getName(), user);
        verify(engine).updateUser(user);
    }

    @Test
    public void testUserExistsInOneEngine() throws Exception {
        boolean result = engineManager.userExists("error", "user");
        verify(engine, times(0)).userExists("user");
        assertFalse(result);

        result = engineManager.userExists(engine.getClass().getName(), "user");
        verify(engine).userExists("user");
        assertTrue(result);
    }

    @Test
    public void testUserExistsInAllEngines() throws Exception {
        boolean result = engineManager.userExists("user");
        verify(engine, times(1)).userExists("user");
        assertTrue(result);

        when(engine.userExists(anyString())).thenReturn(false);
        result = engineManager.userExists("user");
        verify(engine, times(2)).userExists("user");
        assertFalse(result);
    }

    @Test
    public void testGetGroups() throws Exception {
        Set<Group> groups = engineManager.getGroups("error");
        verify(engine, times(0)).getGroups();
        assertTrue(groups.isEmpty());

        groups = engineManager.getGroups(engine.getClass().getName());
        verify(engine).getGroups();
        assertEquals(1, groups.size());
    }

    @Test
    public void testCreateGroup() throws Exception {
        Group result = engineManager.createGroup("error", groupConfig);
        verify(engine, times(0)).createGroup(groupConfig);
        assertNull(result);

        result = engineManager.createGroup(engine.getClass().getName(), groupConfig);
        verify(engine).createGroup(groupConfig);
        assertNotNull(result);
        assertEquals(group, result);
    }

    @Test
    public void testStoreGroup() throws Exception {
        engineManager.storeGroup("error", group);
        verify(engine, times(0)).storeGroup(group);

        engineManager.storeGroup(engine.getClass().getName(), group);
        verify(engine).storeGroup(group);
    }

    @Test
    public void testRetrieveGroup() throws Exception {
        Optional<Group> result = engineManager.retrieveGroup("error", "group");
        verify(engine, times(0)).retrieveGroup("group");
        assertFalse(result.isPresent());

        result = engineManager.retrieveGroup(engine.getClass().getName(), "group");
        verify(engine).retrieveGroup("group");
        assertTrue(result.isPresent());
        assertEquals(group, result.get());
    }

    @Test
    public void testDeleteGroup() throws Exception {
        engineManager.deleteGroup("error", "group");
        verify(engine, times(0)).deleteGroup("group");

        engineManager.deleteGroup(engine.getClass().getName(), "group");
        verify(engine).deleteGroup("group");
    }

    @Test
    public void testUpdateGroup() throws Exception {
        engineManager.updateGroup("error", group);
        verify(engine, times(0)).updateGroup(group);

        engineManager.updateGroup(engine.getClass().getName(), group);
        verify(engine).updateGroup(group);
    }

    @Test
    public void testGroupExistsInOneEngine() throws Exception {
        boolean result = engineManager.groupExists("error", "group");
        verify(engine, times(0)).groupExists("group");
        assertFalse(result);

        result = engineManager.groupExists(engine.getClass().getName(), "group");
        verify(engine).groupExists("group");
        assertTrue(result);
    }

    @Test
    public void testGroupExistsInAllEngines() throws Exception {
        boolean result = engineManager.groupExists("group");
        verify(engine).groupExists("group");
        assertTrue(result);

        when(engine.groupExists(anyString())).thenReturn(false);
        result = engineManager.groupExists("group");
        verify(engine, times(2)).groupExists("group");
        assertFalse(result);
    }

    @Test
    public void testGetUserRolesInOneEngine() throws Exception {
        Set<Role> roles = engineManager.getUserRoles("error", "user");
        verify(engine, times(0)).getUserRoles("user");
        assertTrue(roles.isEmpty());

        roles = engineManager.getUserRoles(engine.getClass().getName(), "user");
        verify(engine).getUserRoles("user");
        assertEquals(1, roles.size());
    }

    @Test
    public void testGetUserRolesInAllEngines() throws Exception {
        Set<Role> roles = engineManager.getUserRoles("user");
        verify(engine).getUserRoles("user");
        assertEquals(1, roles.size());
    }

    @Test
    public void testCheckPassword() throws Exception {
        boolean result = engineManager.checkPassword("error", "user", "password");
        verify(engine, times(0)).checkPassword("user", "password");
        assertFalse(result);

        result = engineManager.checkPassword(engine.getClass().getName(), "user", "password");
        verify(engine).checkPassword("user", "password");
        assertTrue(result);
    }

    @Test
    public void testGetUsername() throws Exception {
        Optional<String> result = engineManager.getUsername(user.getResource());
        assertTrue(result.isPresent());
        assertEquals(result.get(), user.getUsername().get().stringValue());

        result = engineManager.getUsername(vf.createIRI("http://example.com/error"));
        assertFalse(result.isPresent());
    }
}
