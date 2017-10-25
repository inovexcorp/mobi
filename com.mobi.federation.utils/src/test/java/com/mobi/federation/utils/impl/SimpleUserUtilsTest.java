package com.mobi.federation.utils.impl;

/*-
 * #%L
 * com.mobi.federation.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.MockitoAnnotations.initMocks;

import com.mobi.federation.api.FederationService;
import com.mobi.federation.api.serializable.SerializedUser;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.LiteralValueConverter;
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.security.auth.login.FailedLoginException;
import javax.security.auth.login.LoginException;

public class SimpleUserUtilsTest {
    private SimpleUserUtils utils = new SimpleUserUtils();
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private UserFactory userFactory = new UserFactory();
    private User user;
    private User badUser;

    private final Map<UUID, Set<SerializedUser>> userMap = new HashMap<>();
    private final UUID nodeId = UUID.randomUUID();
    private final UUID populated = UUID.randomUUID();
    private final String federationId = "federationId";
    private final String username = "username";
    private final String userId = "https://mobi.com/users#good";
    private final String badUserId = "https://mobi.com/users#bad";

    @Mock
    private FederationService service;

    @Before
    public void setUp() throws Exception {
        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(userFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        utils.setUserFactory(userFactory);
        utils.setValueFactory(vf);

        user = userFactory.createNew(vf.createIRI(userId));
        user.setUsername(vf.createLiteral(username));
        userMap.put(populated, Stream.of(new SerializedUser(user)).collect(Collectors.toSet()));
        badUser = userFactory.createNew(vf.createIRI(badUserId));

        initMocks(this);
        when(service.<UUID, Set<SerializedUser>>getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY))
                .thenReturn(userMap);
        when(service.getNodeId()).thenReturn(nodeId);
        when(service.getFederationId()).thenReturn(federationId);
        when(service.getFederationNodeIds()).thenReturn(Stream.of(nodeId, populated).collect(Collectors.toSet()));
    }

    @Test
    public void testCreateMapEntry() {
        utils.createMapEntry(service);
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getNodeId();
        assertEquals(2, userMap.keySet().size());
        assertTrue(userMap.containsKey(nodeId));
        assertEquals(0, userMap.get(nodeId).size());
    }

    @Test
    public void testCreateMapEntryAlreadyThere() {
        // Setup:
        when(service.getNodeId()).thenReturn(populated);

        utils.createMapEntry(service);
        verify(service).getNodeId();
        assertEquals(1, userMap.keySet().size());
        assertTrue(userMap.containsKey(populated));
        assertEquals(1, userMap.get(populated).size());
    }

    @Test
    public void testRemoveMapEntry() {
        utils.removeMapEntry(service);
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getNodeId();
        assertEquals(1, userMap.keySet().size());
        assertTrue(userMap.containsKey(populated));
        assertEquals(1, userMap.get(populated).size());
    }

    @Test
    public void testRemoveMapEntryNotThere() {
        // Setup:
        when(service.getNodeId()).thenReturn(populated);

        utils.removeMapEntry(service);
        verify(service).getNodeId();
        assertEquals(0, userMap.keySet().size());
    }

    @Test
    public void testAddUser() {
        // Setup:
        userMap.put(nodeId, new HashSet<>());

        utils.addUser(service, user);
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getNodeId();
        verify(service).getFederationId();
        assertEquals(1, userMap.get(nodeId).size());
        SerializedUser serializedUser = userMap.get(nodeId).iterator().next();
        assertEquals(username, serializedUser.getUsername());
        assertEquals(userId, serializedUser.getUserIRI());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddUserWithBadUser() {
        utils.addUser(service, badUser);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddUserThatAlreadyExists() {
        // Setup:
        when(service.getNodeId()).thenReturn(populated);

        utils.addUser(service, user);
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getNodeId();
        verify(service).getFederationId();
        assertEquals(1, userMap.get(populated).size());
        SerializedUser serializedUser = userMap.get(populated).iterator().next();
        assertEquals(username, serializedUser.getUsername());
        assertEquals(userId, serializedUser.getUserIRI());
    }

    @Test
    public void testRemoveUser() {
        // Setup:
        when(service.getNodeId()).thenReturn(populated);

        utils.removeUser(service, username);
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getNodeId();
        verify(service).getFederationId();
        assertEquals(0, userMap.get(populated).size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveUserThatAlreadyExists() {
        // Setup:
        userMap.put(nodeId, new HashSet<>());

        utils.removeUser(service, username);
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getNodeId();
        verify(service).getFederationId();
    }

    @Test
    public void testUpdateUser() {
        // Setup:
        when(service.getNodeId()).thenReturn(populated);
        String newUsername = "new-username";
        User newUser = userFactory.createNew(vf.createIRI(userId));
        newUser.setUsername(vf.createLiteral(newUsername));

        utils.updateUser(service, newUser);
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getNodeId();
        verify(service).getFederationId();
        assertEquals(1, userMap.get(populated).size());
        SerializedUser serializedUser = userMap.get(populated).iterator().next();
        assertEquals(newUsername, serializedUser.getUsername());
        assertEquals(userId, serializedUser.getUserIRI());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateUserWithBadUser() {
        utils.updateUser(service, badUser);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testUpdateUserWithNoIRIMatch() {
        // Setup:
        User newUser = userFactory.createNew(vf.createIRI("https://mobi.com/users#new"));
        newUser.setUsername(vf.createLiteral("new-username"));

        utils.updateUser(service, user);
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getNodeId();
        verify(service).getFederationId();
    }

    @Test
    public void testGetUser() {
        User result = utils.getUser(service, username, populated.toString());
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getFederationId();
        assertEquals(userId, result.getResource().stringValue());
        assertEquals(username, result.getUsername().get().stringValue());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUserWithBadNodeId() {
        utils.getUser(service, username, nodeId.toString());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetUserMissingUsername() {
        utils.getUser(service, "missing", populated.toString());
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getFederationId();
    }

    @Test
    public void testVerifyUser() throws Exception {
        utils.verifyUser(service, username);
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getFederationNodeIds();
    }

    @Test(expected = FailedLoginException.class)
    public void testVerifyUserMissingUsername() throws Exception {
        utils.verifyUser(service, "missing");
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
        verify(service).getFederationNodeIds();
    }

    @Test
    public void testVerifyUserByNodeId() throws Exception {
        utils.verifyUser(service, username, populated.toString());
        verify(service).getFederationNodeIds();
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
    }

    @Test(expected = FailedLoginException.class)
    public void testVerifyUserByNodeIdMissingUsername() throws Exception {
        utils.verifyUser(service, "missing", nodeId.toString());
        verify(service).getFederationNodeIds();
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
    }

    @Test(expected = FailedLoginException.class)
    public void testVerifyUserByNodeIdUsernameInOtherNode() throws Exception {
        utils.verifyUser(service, username, nodeId.toString());
        verify(service).getFederationNodeIds();
        verify(service).getDistributedMap(SimpleUserUtils.FEDERATION_USERS_KEY);
    }

    @Test(expected = LoginException.class)
    public void testVerifyUserByNodeIdMissingNodeId() throws Exception {
        utils.verifyUser(service, username, UUID.randomUUID().toString());
        verify(service).getFederationNodeIds();
    }
}
