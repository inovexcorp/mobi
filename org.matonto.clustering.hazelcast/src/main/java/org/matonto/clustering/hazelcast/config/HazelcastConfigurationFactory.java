package org.matonto.clustering.hazelcast.config;


import com.hazelcast.config.Config;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This utility class will convert a given {@link HazelcastClusteringServiceConfig} configuration object into a
 * {@link Config} object capable of configuring a {@link com.hazelcast.core.HazelcastInstance} to discover and
 * communicate with other MatOnto nodes.
 */
public class HazelcastConfigurationFactory {

    /**
     * {@link Logger} for this service.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(HazelcastConfigurationFactory.class);

    /**
     * Build a {@link Config} object from a given service configuration.
     *
     * @param serviceConfig The {@link HazelcastClusteringServiceConfig} service configuration
     * @return The {@link Config} we'll use to initialize our {@link com.hazelcast.core.HazelcastInstance}
     */
    public static Config build(final HazelcastClusteringServiceConfig serviceConfig) {
        final Config config = new Config();
        if (StringUtils.isNotBlank(serviceConfig.instanceName())) {
            config.setInstanceName(serviceConfig.instanceName());
            LOGGER.debug("Configured instance name to: {}", serviceConfig.instanceName());
        }
        if (serviceConfig.basicPort() > 0) {
            config.getNetworkConfig().setPort(serviceConfig.basicPort());
            LOGGER.debug("Configured our base port to: {}", serviceConfig.basicPort());
        }
        if (serviceConfig.multicastPort() > 0) {
            config.getNetworkConfig().getJoin().getMulticastConfig().setMulticastPort(serviceConfig.multicastPort());
            config.getNetworkConfig().getJoin().getMulticastConfig().setEnabled(true);
            LOGGER.debug("Configured our multicast port to: {}", serviceConfig.multicastPort());
        }
        if (StringUtils.isNotBlank(serviceConfig.multicastGroup())) {
            LOGGER.debug("Configured multicast group to: {}", serviceConfig.multicastGroup());
            config.getNetworkConfig().getJoin().getMulticastConfig().setMulticastGroup(serviceConfig.multicastGroup());
        }
        if (serviceConfig.outboundPorts() != null && !serviceConfig.outboundPorts().isEmpty()) {
            config.getNetworkConfig().setOutboundPorts(serviceConfig.outboundPorts());
            LOGGER.debug("Configured our outbound ports to: {}",
                    StringUtils.join(serviceConfig.outboundPorts(), ", "));
        }
        if (StringUtils.isNotBlank(serviceConfig.groupConfigName())) {
            config.getGroupConfig().setName(serviceConfig.groupConfigName());
            LOGGER.debug("Configured group name to: {}", serviceConfig.groupConfigName());
        }
        if (StringUtils.isNotBlank(serviceConfig.groupConfigPassword())) {
            config.getGroupConfig().setPassword(serviceConfig.groupConfigPassword());
            LOGGER.debug("Configured group password...");
        }
        if (serviceConfig.multicastTimeoutSeconds() > 0) {
            config.getNetworkConfig().getJoin().getMulticastConfig().setMulticastTimeoutSeconds(serviceConfig.multicastTimeoutSeconds());
            LOGGER.debug("Configured multicast timeout seconds to: {}", serviceConfig.multicastTimeoutSeconds());
        }
        return config;
    }

}
