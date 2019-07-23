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


import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertNotNull;
import static junit.framework.TestCase.assertNull;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

public class SimpleEngineManagerTest extends OrmEnabledTestCase {
    private SimpleEngineManager engineManager;

    private static final String USER_STR = "http://mobi.com/users/tester";
    private static final IRI USER_IRI = VALUE_FACTORY.createIRI(USER_STR);
    private static final String USERNAME = "tester";
    private static final String ERROR = "error";
    private static final String ERROR_STR = "http://example.com/error";
    private static final IRI ERROR_IRI = VALUE_FACTORY.createIRI(ERROR_STR);

    @Mock
    Engine engine;

    @Mock
    User user;

    @Mock
    User errorUser;

    @Mock
    Group group;

    @Mock
    Group errorGroup;

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
        when(engine.getRole(ERROR)).thenReturn(Optional.empty());
        when(engine.getUsers()).thenReturn(Collections.singleton(user));
        when(engine.getGroups()).thenReturn(Collections.singleton(group));
        when(engine.createUser(any(UserConfig.class))).thenReturn(user);
        when(engine.createGroup(any(GroupConfig.class))).thenReturn(group);
        when(engine.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(engine.retrieveUser(ERROR)).thenReturn(Optional.empty());
        when(engine.retrieveGroup(anyString())).thenReturn(Optional.of(group));
        when(engine.retrieveGroup(ERROR)).thenReturn(Optional.empty());
        when(engine.userExists(anyString())).thenReturn(true);
        when(engine.userExists(any(Resource.class))).thenReturn(true);
        when(engine.userExists(ERROR_IRI)).thenReturn(false);
        when(engine.groupExists(anyString())).thenReturn(true);
        when(engine.groupExists(any(Resource.class))).thenReturn(true);
        when(engine.groupExists(ERROR_IRI)).thenReturn(false);
        when(engine.getUserRoles(anyString())).thenReturn(Collections.singleton(role));
        when(engine.checkPassword(anyString(), anyString())).thenReturn(true);
        when(engine.checkPassword(eq(ERROR), anyString())).thenReturn(false);

        when(user.getResource()).thenReturn(USER_IRI);
        when(user.getUsername()).thenReturn(Optional.of(VALUE_FACTORY.createLiteral(USERNAME)));

        when(errorUser.getResource()).thenReturn(ERROR_IRI);

        when(errorGroup.getResource()).thenReturn(ERROR_IRI);

        engineManager = new SimpleEngineManager();
        engineManager.addEngine(engine);
    }

    @Test
    public void testContainsEngine() {
        boolean result = engineManager.containsEngine(engine.getEngineName());
        assertTrue(result);

        result = engineManager.containsEngine(ERROR);
        assertFalse(result);
    }
    
    @Test
    public void testGetRoleForEngine() {
        Optional<Role> roleOptional = engineManager.getRole(ERROR, "role");
        verify(engine, times(0)).getRole("role");
        assertFalse(roleOptional.isPresent());

        roleOptional = engineManager.getRole(engine.getEngineName(), "role");
        verify(engine).getRole("role");
        assertTrue(roleOptional.isPresent());
        assertEquals(roleOptional.get(), role);
    }

    @Test
    public void testGetRole() {
        Optional<Role> result = engineManager.getRole(ERROR);
        verify(engine).getRole(ERROR);
        assertFalse(result.isPresent());

        Optional<Role> roleOptional = engineManager.getRole("role");
        verify(engine).getRole("role");
        assertTrue(roleOptional.isPresent());
        assertEquals(roleOptional.get(), role);
    }

    @Test
    public void testGetUsersForEngine() {
        Set<User> users = engineManager.getUsers(ERROR);
        verify(engine, times(0)).getUsers();
        assertTrue(users.isEmpty());

        users = engineManager.getUsers(engine.getEngineName());
        verify(engine).getUsers();
        assertEquals(1, users.size());
    }

    @Test
    public void testGetUsersForAllEngines() {
        Set<User> users = engineManager.getUsers();
        verify(engine).getUsers();
        assertEquals(1, users.size());
    }

    @Test
    public void testCreateUser() {
        User result = engineManager.createUser(ERROR, userConfig);
        verify(engine, times(0)).createUser(userConfig);
        assertNull(result);

        result = engineManager.createUser(engine.getEngineName(), userConfig);
        verify(engine).createUser(userConfig);
        assertNotNull(result);
        assertEquals(user, result);
    }

    @Test
    public void testStoreUser() {
        engineManager.storeUser(ERROR, user);
        verify(engine, times(0)).storeUser(user);

        engineManager.storeUser(engine.getEngineName(), user);
        verify(engine).storeUser(user);
    }

    @Test
    public void testRetrieveUserFromEngine() {
        Optional<User> result = engineManager.retrieveUser(ERROR, "user");
        verify(engine, times(0)).retrieveUser("user");
        assertFalse(result.isPresent());

        result = engineManager.retrieveUser(engine.getEngineName(), "user");
        verify(engine).retrieveUser("user");
        assertTrue(result.isPresent());
        assertEquals(user, result.get());
    }

    @Test
    public void testRetrieveUser() {
        Optional<User> result = engineManager.retrieveUser(ERROR);
        verify(engine).retrieveUser(ERROR);
        assertFalse(result.isPresent());

        result = engineManager.retrieveUser("user");
        verify(engine).retrieveUser("user");
        assertTrue(result.isPresent());
        assertEquals(user, result.get());
    }

    @Test
    public void testDeleteUser() {
        engineManager.deleteUser(ERROR, "user");
        verify(engine, times(0)).deleteUser("user");

        engineManager.deleteUser(engine.getEngineName(), "user");
        verify(engine).deleteUser("user");
    }

    @Test
    public void testUpdateUserWithEngine() {
        engineManager.updateUser(ERROR, user);
        verify(engine, times(0)).updateUser(user);

        engineManager.updateUser(engine.getEngineName(), user);
        verify(engine).updateUser(user);
    }

    @Test
    public void testUpdateUser() {
        engineManager.updateUser(errorUser);
        verify(engine, times(0)).updateUser(any(User.class));

        engineManager.updateUser(user);
        verify(engine).updateUser(user);
    }

    @Test
    public void testUserExistsInOneEngine() {
        boolean result = engineManager.userExists(ERROR, "user");
        verify(engine, times(0)).userExists("user");
        assertFalse(result);

        result = engineManager.userExists(engine.getEngineName(), "user");
        verify(engine).userExists("user");
        assertTrue(result);
    }

    @Test
    public void testUserExistsInAllEngines() {
        boolean result = engineManager.userExists("user");
        verify(engine, times(1)).userExists("user");
        assertTrue(result);

        when(engine.userExists(anyString())).thenReturn(false);
        result = engineManager.userExists("user");
        verify(engine, times(2)).userExists("user");
        assertFalse(result);
    }

    @Test
    public void testGetGroups() {
        Set<Group> groups = engineManager.getGroups(ERROR);
        verify(engine, times(0)).getGroups();
        assertTrue(groups.isEmpty());

        groups = engineManager.getGroups(engine.getEngineName());
        verify(engine).getGroups();
        assertEquals(1, groups.size());
    }

    @Test
    public void testGetGroupsForAllEngines() {
        Set<Group> groups = engineManager.getGroups();
        verify(engine).getGroups();
        assertEquals(1, groups.size());
    }

    @Test
    public void testCreateGroup() {
        Group result = engineManager.createGroup(ERROR, groupConfig);
        verify(engine, times(0)).createGroup(groupConfig);
        assertNull(result);

        result = engineManager.createGroup(engine.getEngineName(), groupConfig);
        verify(engine).createGroup(groupConfig);
        assertNotNull(result);
        assertEquals(group, result);
    }

    @Test
    public void testStoreGroup() {
        engineManager.storeGroup(ERROR, group);
        verify(engine, times(0)).storeGroup(group);

        engineManager.storeGroup(engine.getEngineName(), group);
        verify(engine).storeGroup(group);
    }

    @Test
    public void testRetrieveGroupFromEngine() {
        Optional<Group> result = engineManager.retrieveGroup(ERROR, "group");
        verify(engine, times(0)).retrieveGroup("group");
        assertFalse(result.isPresent());

        result = engineManager.retrieveGroup(engine.getEngineName(), "group");
        verify(engine).retrieveGroup("group");
        assertTrue(result.isPresent());
        assertEquals(group, result.get());
    }

    @Test
    public void testRetrieveGroup() {
        Optional<Group> result = engineManager.retrieveGroup(ERROR);
        verify(engine).retrieveGroup(ERROR);
        assertFalse(result.isPresent());

        result = engineManager.retrieveGroup("group");
        verify(engine).retrieveGroup("group");
        assertTrue(result.isPresent());
        assertEquals(group, result.get());
    }

    @Test
    public void testDeleteGroup() {
        engineManager.deleteGroup(ERROR, "group");
        verify(engine, times(0)).deleteGroup("group");

        engineManager.deleteGroup(engine.getEngineName(), "group");
        verify(engine).deleteGroup("group");
    }

    @Test
    public void testUpdateGroupWithEngine() {
        engineManager.updateGroup(ERROR, group);
        verify(engine, times(0)).updateGroup(group);

        engineManager.updateGroup(engine.getEngineName(), group);
        verify(engine).updateGroup(group);
    }

    @Test
    public void testUpdateGroup() {
        engineManager.updateGroup(errorGroup);
        verify(engine, times(0)).updateGroup(any(Group.class));

        engineManager.updateGroup(group);
        verify(engine).updateGroup(group);
    }

    @Test
    public void testGroupExistsInOneEngine() {
        boolean result = engineManager.groupExists(ERROR, "group");
        verify(engine, times(0)).groupExists("group");
        assertFalse(result);

        result = engineManager.groupExists(engine.getEngineName(), "group");
        verify(engine).groupExists("group");
        assertTrue(result);
    }

    @Test
    public void testGroupExistsInAllEngines() {
        boolean result = engineManager.groupExists("group");
        verify(engine).groupExists("group");
        assertTrue(result);

        when(engine.groupExists(anyString())).thenReturn(false);
        result = engineManager.groupExists("group");
        verify(engine, times(2)).groupExists("group");
        assertFalse(result);
    }

    @Test
    public void testGetUserRolesInOneEngine() {
        Set<Role> roles = engineManager.getUserRoles(ERROR, "user");
        verify(engine, times(0)).getUserRoles("user");
        assertTrue(roles.isEmpty());

        roles = engineManager.getUserRoles(engine.getEngineName(), "user");
        verify(engine).getUserRoles("user");
        assertEquals(1, roles.size());
    }

    @Test
    public void testGetUserRolesInAllEngines() {
        Set<Role> roles = engineManager.getUserRoles("user");
        verify(engine).getUserRoles("user");
        assertEquals(1, roles.size());
    }

    @Test
    public void testCheckPassword() {
        boolean result = engineManager.checkPassword(ERROR, "user", "password");
        verify(engine, times(0)).checkPassword("user", "password");
        assertFalse(result);

        result = engineManager.checkPassword(engine.getEngineName(), "user", "password");
        verify(engine).checkPassword("user", "password");
        assertTrue(result);
    }

    @Test
    public void testCheckPasswordErrorUserInAllEngines() {
        // Setup:
        Engine secondEngine = Mockito.mock(Engine.class);
        when(secondEngine.checkPassword(anyString(), anyString())).thenReturn(false);
        when(secondEngine.getEngineName()).thenReturn("Second Engine");
        engineManager.addEngine(secondEngine);

        boolean result = engineManager.checkPassword(ERROR, "password");
        verify(engine).checkPassword(ERROR, "password");
        verify(secondEngine).checkPassword(ERROR, "password");
        assertFalse(result);
    }

    @Test
    public void testCheckPasswordInAllEngines() {
        // Setup:
        Engine secondEngine = Mockito.mock(Engine.class);
        when(secondEngine.checkPassword(anyString(), anyString())).thenReturn(false);
        when(secondEngine.getEngineName()).thenReturn("Second Engine");
        engineManager.addEngine(secondEngine);

        boolean result = engineManager.checkPassword(USERNAME, "password");
        verify(engine).checkPassword(USERNAME, "password");
        verify(secondEngine, times(0)).checkPassword(USERNAME, "password");
        assertTrue(result);
    }

    @Test
    public void testGetUsername() {
        Optional<String> result = engineManager.getUsername(user.getResource());
        assertTrue(result.isPresent());
        assertEquals(result.get(), user.getUsername().get().stringValue());

        result = engineManager.getUsername(ERROR_IRI);
        assertFalse(result.isPresent());
    }
}
