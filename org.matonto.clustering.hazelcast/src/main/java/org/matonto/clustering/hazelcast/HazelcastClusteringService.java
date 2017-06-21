package org.matonto.clustering.hazelcast;

/*-
 * #%L
 * clustering.hazelcast
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Deactivate;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.metatype.Configurable;
import com.hazelcast.config.Config;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;
import org.apache.commons.lang.StringUtils;
import org.matonto.clustering.api.ClusteringService;
import org.osgi.framework.BundleContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * This is the {@link ClusteringService} implementation built on top of Hazelcast.
 */
@Component(immediate = true,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = HazelcastClusteringServiceConfig.class,
        name = HazelcastClusteringService.NAME,
        provide = ClusteringService.class,
        properties = {
                "clusteringType=hazelcast"
        }
)
public class HazelcastClusteringService implements ClusteringService {

    /**
     * The name of this service type.
     */
    static final String NAME = "org.matonto.clustering.hazelcast";

    /**
     * {@link Logger} for this service.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(HazelcastClusteringService.class);

    /**
     * Hazelcast instance that will drive the features of this {@link ClusteringService} implementation.
     */
    private HazelcastInstance hazelcastInstance;

    /**
     * {@link BundleContext} for this service.
     */
    private BundleContext bundleContext;

    /**
     * Method that joins the hazelcast cluster when the service is activated.
     */
    @Activate
    public void activate(BundleContext context, Map<String, Object> configuration) {
        final HazelcastClusteringServiceConfig serviceConfig = Configurable.createConfigurable(HazelcastClusteringServiceConfig.class, configuration);
        this.bundleContext = context;
        if (serviceConfig.enabled()) {
            final Config config = new Config();
            LOGGER.debug("Spinning up underlying hazelcast instance");
            LOGGER.info("Initializing Hazelcast based Clustering Service");
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
            this.hazelcastInstance = Hazelcast.newHazelcastInstance(config);
            LOGGER.info("Successfully initialized Hazelcast instance");

            // Listen to lifecycle changes...
            this.hazelcastInstance.getLifecycleService().addLifecycleListener((event) -> {
                LOGGER.warn("{}: State Change: {}: {}", this.toString(), event.getState().name(), event.toString());
            });
        } else {
            LOGGER.warn("Service initialized in disabled state... Not going to start a hazelcast node " +
                    "instance and join cluster");
        }
    }

    /**
     * Method triggered when the configuration changes for this service.
     *
     * @param context       The {@link BundleContext} for this service
     * @param configuration The configuration map for this service
     */
    @Modified
    public void modified(BundleContext context, Map<String, Object> configuration) {
        LOGGER.warn("Modified configuration of service! Going to deactivate, and re-activate with new configuration...");
        deactivate();
        activate(context, configuration);
    }

    /**
     * Method that spins down the hazelcast instance, leaves the cluster, on deactivation.
     */
    @Deactivate
    public void deactivate() {
        LOGGER.info("Shutting down underlying hazelcast instance");
        this.hazelcastInstance.shutdown();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int getMemberCount() {
        return this.hazelcastInstance.getCluster().getMembers().size();
    }

}
