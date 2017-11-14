package com.mobi.federation.utils.impl;

/*-
 * #%L
 * federation.hazelcast
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

import static com.mobi.federation.utils.serializable.SerializedUser.getAsUser;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.federation.api.FederationService;
import com.mobi.federation.utils.serializable.SerializedUser;
import com.mobi.federation.utils.api.UserUtils;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.rdf.api.ValueFactory;

import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import javax.security.auth.login.FailedLoginException;
import javax.security.auth.login.LoginException;

@Component
public class SimpleUserUtils implements UserUtils {
    static final String FEDERATION_USERS_KEY = "federation.users";

    private UserFactory userFactory;
    private ValueFactory vf;

    @Reference
    void setUserFactory(UserFactory userFactory) {
        this.userFactory = userFactory;
    }

    @Reference
    void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public void createMapEntry(FederationService service) {
        Map<UUID, Set<SerializedUser>> userMap = service.getDistributedMap(FEDERATION_USERS_KEY);
        UUID nodeId = service.getNodeId();
        if (!userMap.containsKey(nodeId)) {
            userMap.put(nodeId, new HashSet<>());
        }
    }

    @Override
    public void removeMapEntry(FederationService service) {
        Map<UUID, Set<SerializedUser>> userMap = service.getDistributedMap(FEDERATION_USERS_KEY);
        UUID nodeId = service.getNodeId();
        if (userMap.containsKey(nodeId)) {
            userMap.remove(nodeId);
        }
    }

    @Override
    public void addUser(FederationService service, User user) {
        String username = user.getUsername().orElseThrow(() ->
                new IllegalArgumentException("The user must have a username.")).stringValue();

        Map<UUID, Set<SerializedUser>> userMap = service.getDistributedMap(FEDERATION_USERS_KEY);
        UUID nodeId = service.getNodeId();
        String federationId = service.getFederationId();
        Set<SerializedUser> users = getNodeUsers(userMap, nodeId, federationId);

        if (!userExists(users, username)) {
            users.add(new SerializedUser(user));
            userMap.put(nodeId, users);
        } else {
            throw new IllegalArgumentException("A user with username " + username + " already exists on node "
                    + nodeId.toString() + " in federation " + federationId);
        }
    }

    @Override
    public void removeUser(FederationService service, String username) {
        Map<UUID, Set<SerializedUser>> userMap = service.getDistributedMap(FEDERATION_USERS_KEY);
        UUID nodeId = service.getNodeId();
        String federationId = service.getFederationId();
        Set<SerializedUser> users = getNodeUsers(userMap, nodeId, federationId);

        if (userExists(users, username)) {
            users.removeIf(serializedUser -> serializedUser.getUsername().equals(username));
            userMap.put(nodeId, users);
        } else {
            throw new IllegalArgumentException("User with username " + username + " does not exist on node "
                    + nodeId.toString() + " in federation " + federationId);
        }
    }

    @Override
    public void updateUser(FederationService service, User user) {
        if (!user.getUsername().isPresent()) {
            throw new IllegalArgumentException("The user must have a username.");
        }
        String userIRI = user.getResource().stringValue();

        Map<UUID, Set<SerializedUser>> userMap = service.getDistributedMap(FEDERATION_USERS_KEY);
        UUID nodeId = service.getNodeId();
        String federationId = service.getFederationId();
        Set<SerializedUser> users = getNodeUsers(userMap, nodeId, federationId);

        Optional<SerializedUser> optional = users.stream()
                .filter(serializedUser -> serializedUser.getUserIRI().equals(userIRI))
                .findFirst();

        if (optional.isPresent()) {
            users.remove(optional.get());
            users.add(new SerializedUser(user));
            userMap.put(nodeId, users);
        } else {
            throw new IllegalArgumentException("User with IRI " + userIRI + " does not exist on node "
                    + nodeId.toString() + " in federation " + federationId);
        }
    }

    @Override
    public User getUser(FederationService service, String username, String nodeId) {
        Map<UUID, Set<SerializedUser>> userMap = service.getDistributedMap(FEDERATION_USERS_KEY);
        String federationId = service.getFederationId();
        Set<SerializedUser> users = getNodeUsers(userMap, UUID.fromString(nodeId), federationId);

        Optional<SerializedUser> optional = users.stream()
                .filter(user -> user.getUsername().equals(username))
                .findFirst();

        if (optional.isPresent()) {
            return getAsUser(optional.get(), userFactory, vf);
        }
        throw new IllegalArgumentException("User " + username + " does not exist on node " + nodeId
                + " in federation " + federationId);
    }

    @Override
    public void verifyUser(FederationService service, String username) throws FailedLoginException {
        Map<UUID, Set<SerializedUser>> userMap = service.getDistributedMap(FEDERATION_USERS_KEY);
        if (service.getFederationNodeIds().stream().noneMatch(nodeId -> validateUser(userMap, username, nodeId))) {
            throw new FailedLoginException("User " + username + " not found in federation "
                    + service.getFederationId());
        }
    }

    @Override
    public void verifyUser(FederationService service, String username, String nodeId) throws LoginException {
        UUID nodeUUID = UUID.fromString(nodeId);
        if (!service.getFederationNodeIds().contains(nodeUUID)) {
            throw new LoginException("Node " + nodeId + " is not in federation " + service.getFederationId());
        }
        Map<UUID, Set<SerializedUser>> userMap = service.getDistributedMap(FEDERATION_USERS_KEY);
        if (!validateUser(userMap, username, nodeUUID)) {
            throw new FailedLoginException("User " + username + " not found in node " + nodeId + " in federation "
                    + service.getFederationId());
        }
    }

    /**
     * Validates that the provided username is a user registered to the node within the provided user map.
     *
     * @param userMap  The replicated user map.
     * @param username The user's username.
     * @param nodeId   The node ID.
     * @return True if the user exists on the identified node; otherwise, false.
     */
    private boolean validateUser(Map<UUID, Set<SerializedUser>> userMap, String username, UUID nodeId) {
        return userMap.containsKey(nodeId) && userExists(userMap.get(nodeId), username);
    }

    /**
     * Checks for the existence of the user identified by the provided username in the {@link SerializedUser} set.
     *
     * @param users    The Set of users to check.
     * @param username The user's username.
     * @return True if the user exists in the set; otherwise, false.
     */
    private boolean userExists(Set<SerializedUser> users, String username) {
        return users.stream().anyMatch(user -> user.getUsername().equals(username));
    }

    /**
     * Gets a {@link Set} of {@link SerializedUser}s associated with the identified node in the identified federation.
     *
     * @param userMap      The replicated user map.
     * @param nodeId       The node ID.
     * @param federationId The federation ID.
     * @return A {@link Set} of {@link SerializedUser}s for the node.
     */
    private Set<SerializedUser> getNodeUsers(Map<UUID, Set<SerializedUser>> userMap, UUID nodeId, String federationId) {
        if (userMap.containsKey(nodeId)) {
            return userMap.get(nodeId);
        }
        throw new IllegalArgumentException("User map entry for node " + nodeId.toString()
                + " could not be found in federation " + federationId);
    }
}
