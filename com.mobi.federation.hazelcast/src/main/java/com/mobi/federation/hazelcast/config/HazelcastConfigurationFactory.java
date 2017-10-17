package com.mobi.federation.hazelcast.config;

/*-
 * #%L
 * com.mobi.federation.hazelcast
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


import com.hazelcast.config.Config;
import com.hazelcast.config.MulticastConfig;
import com.hazelcast.config.TcpIpConfig;
import org.apache.commons.lang.StringUtils;
import com.mobi.exception.MobiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This utility class will convert a given {@link HazelcastFederationServiceConfig} configuration object into a
 * {@link Config} object capable of configuring a {@link com.hazelcast.core.HazelcastInstance} to discover and
 * communicate with other Mobi nodes.
 */
public class HazelcastConfigurationFactory {

    /**
     * {@link Logger} for this service.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(HazelcastConfigurationFactory.class);

    /**
     * Build a {@link Config} object from a given service configuration.
     *
     * @param serviceConfig The {@link HazelcastFederationServiceConfig} service configuration
     * @return The {@link Config} we'll use to initialize our {@link com.hazelcast.core.HazelcastInstance}
     */
    public static Config build(final HazelcastFederationServiceConfig serviceConfig, final String instanceName) {
        final Config config = new Config();
        // Basic configuration.
        configureBasicConfiguration(serviceConfig, config, instanceName);

        // Protected Hazelcast group.
        configureHazelcastGroup(serviceConfig, config);


        switch (serviceConfig.joinMechanism()) {
            case TCPIP:
                configureTcpIpJoining(serviceConfig, config);
                break;
            case MULTICAST:
                configureMulticast(serviceConfig, config);
                break;
            default:
                throw new MobiException("Unknown join mechanism: " + serviceConfig.joinMechanism());
        }

        return config;
    }

    private static void configureBasicConfiguration(HazelcastFederationServiceConfig serviceConfig, Config config,
                                                    String instanceName) {
        if (StringUtils.isNotBlank(instanceName)) {
            config.setInstanceName(instanceName);
        }
        if (serviceConfig.listeningPort() > 0) {
            config.getNetworkConfig().setPort(serviceConfig.listeningPort());
            LOGGER.debug("Configured our base port to: {}", serviceConfig.listeningPort());
        }
        if (serviceConfig.outboundPorts() != null && !serviceConfig.outboundPorts().isEmpty()) {
            config.getNetworkConfig().setOutboundPorts(serviceConfig.outboundPorts());
            LOGGER.debug("Configured our outbound ports to: {}",
                    StringUtils.join(serviceConfig.outboundPorts(), ", "));
        }
    }

    private static void configureHazelcastGroup(HazelcastFederationServiceConfig serviceConfig, Config config) {
        if (StringUtils.isNotBlank(serviceConfig.groupConfigName())) {
            config.getGroupConfig().setName(serviceConfig.groupConfigName());
            LOGGER.debug("Configured group name to: {}", serviceConfig.groupConfigName());
        }
        if (StringUtils.isNotBlank(serviceConfig.groupConfigPassword())) {
            config.getGroupConfig().setPassword(serviceConfig.groupConfigPassword());
            LOGGER.debug("Configured group password...");
        }
    }

    private static void configureMulticast(HazelcastFederationServiceConfig serviceConfig, Config config) {
        final MulticastConfig multicastConfig = config.getNetworkConfig().getJoin().getMulticastConfig();
        config.getNetworkConfig().getJoin().getMulticastConfig().setEnabled(true);
        config.getNetworkConfig().getJoin().getTcpIpConfig().setEnabled(false);
        if (serviceConfig.multicastPort() > 0) {
            multicastConfig.setMulticastPort(serviceConfig.multicastPort());
            LOGGER.debug("Configured our multicast port to: {}", serviceConfig.multicastPort());
        }
        if (StringUtils.isNotBlank(serviceConfig.multicastGroup())) {
            LOGGER.debug("Configured multicast group to: {}", serviceConfig.multicastGroup());
            multicastConfig.setMulticastGroup(serviceConfig.multicastGroup());
        }
        if (serviceConfig.multicastTimeoutSeconds() > 0) {
            multicastConfig.setMulticastTimeoutSeconds(serviceConfig.multicastTimeoutSeconds());
            LOGGER.debug("Configured multicast timeout seconds to: {}", serviceConfig.multicastTimeoutSeconds());
        }
    }

    private static void configureTcpIpJoining(HazelcastFederationServiceConfig serviceConfig, Config config) {
        final TcpIpConfig tcpIpConfig = config.getNetworkConfig().getJoin().getTcpIpConfig();
        config.getNetworkConfig().getJoin().getMulticastConfig().setEnabled(false);
        config.getNetworkConfig().getJoin().getTcpIpConfig().setEnabled(true);
        if (serviceConfig.tcpIpMembers() != null && !serviceConfig.tcpIpMembers().isEmpty()) {
            serviceConfig.tcpIpMembers().forEach(tcpIpConfig::addMember);
            LOGGER.debug("Configured TCP/IP members to: {}",
                    StringUtils.join(serviceConfig.tcpIpMembers(), ", "));
        }
        if (serviceConfig.tcpIpTimeoutSeconds() > 0) {
            tcpIpConfig.setConnectionTimeoutSeconds(serviceConfig.tcpIpTimeoutSeconds());
            LOGGER.debug("Configured TCP/IP timeout (seconds) to: {}", serviceConfig.tcpIpTimeoutSeconds());
        }
    }

}
