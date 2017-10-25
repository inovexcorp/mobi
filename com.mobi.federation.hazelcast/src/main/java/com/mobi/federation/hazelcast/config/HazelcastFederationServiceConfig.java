package com.mobi.federation.hazelcast.config;

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

import aQute.bnd.annotation.metatype.Meta;
import com.mobi.federation.api.FederationServiceConfig;
import com.mobi.federation.hazelcast.HazelcastFederationService;

import java.util.Set;

/**
 * This is the interface describing the service configuration for the
 * {@link HazelcastFederationService}.
 */
@Meta.OCD(factory = true)
public interface HazelcastFederationServiceConfig extends FederationServiceConfig {

    /**
     * The listening port for this {@link com.hazelcast.core.HazelcastInstance}.
     */
    @Meta.AD(required = false)
    int listeningPort();

    /**
     * A set of ports to use for outbound communication if you need to override them.
     */
    @Meta.AD(required = false)
    Set<Integer> outboundPorts();

    /**
     * A group name for the federation that this {@link com.hazelcast.core.HazelcastInstance} will join.
     */
    @Meta.AD(required = false)
    String groupConfigName();

    /**
     * The password for the given group name this {@link com.hazelcast.core.HazelcastInstance} will join
     * in the federation.
     */
    @Meta.AD(required = false)
    String groupConfigPassword();

    /**
     * The Hazelcast join mechanism to use (MULTICAST vs TCPIP).
     */
    @Meta.AD(required = false, deflt = "MULTICAST")
    JoinMechanism joinMechanism();

    /**
     * Configured tcp/ip members the federation will attempt to communicate with.
     */
    @Meta.AD(required = false)
    Set<String> tcpIpMembers();

    /**
     * The number of seconds before a timeout occurs when connecting over TCP/IP for federation.
     */
    @Meta.AD(required = false)
    int tcpIpTimeoutSeconds();

    /**
     * The port to use for multicast in this {@link com.hazelcast.core.HazelcastInstance}.
     */
    @Meta.AD(required = false)
    int multicastPort();

    /**
     * The group address to use for multicast in this {@link com.hazelcast.core.HazelcastInstance}.
     */
    @Meta.AD(required = false)
    String multicastGroup();

    /**
     * The timeout in seconds for multicast communication.
     */
    @Meta.AD(required = false)
    int multicastTimeoutSeconds();

    /**
     * The maximum number of seconds before a node is considered inactive based on a lack of heartbeats.
     */
    @Meta.AD(required = false)
    int maxNoHeartbeatSeconds();
}
