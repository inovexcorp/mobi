package org.matonto.federation.hazelcast;

/*-
 * #%L
 * org.matonto.federation.hazelcast
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

import aQute.bnd.annotation.component.Component;
import org.matonto.federation.api.FederationService;
import org.matonto.federation.api.FederationUserUtils;
import org.matonto.federation.api.serializable.SerializedUser;

import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import javax.security.auth.login.FailedLoginException;
import javax.security.auth.login.LoginException;

@Component
public class HazelcastFederationUserUtils implements FederationUserUtils {
    public static final String FEDERATION_USERS_KEY = "federation.users";

    @Override
    public void createMapEntry(FederationService service) {
        service.getDistributedMap(FEDERATION_USERS_KEY).put(service.getNodeId(), new TreeSet<>());
    }

    @Override
    public void verifyUser(FederationService service, String username) throws FailedLoginException {
        if (service.getFederationNodeIds().stream().anyMatch(nodeId -> validateUser(service, username, nodeId))) {
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
        if (!validateUser(service, username, nodeUUID)) {
            throw new FailedLoginException("User " + username + " not found in node " + nodeId + " in federation "
                    + service.getFederationId());
        }
    }

    /**
     * Validates that the provided username is a user registered to the node within the provided federation.
     *
     * @param service  The FederationService.
     * @param username The user's username.
     * @param nodeId   The node ID.
     * @return True if the user exists on the identified node; otherwise, false.
     */
    private boolean validateUser(FederationService service, String username, UUID nodeId) {
        Map<UUID, Set<SerializedUser>> userMap = service.getDistributedMap(FEDERATION_USERS_KEY);
        return userMap.containsKey(nodeId)
                && userMap.get(nodeId).stream().anyMatch(user -> user.getUsername().equals(username));
    }
}
