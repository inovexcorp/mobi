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
import org.matonto.clustering.api.ClusteringService;
import org.matonto.clustering.hazelcast.config.HazelcastConfigurationFactory;
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
            final Config config = HazelcastConfigurationFactory.build(serviceConfig);
            LOGGER.debug("Spinning up underlying hazelcast instance");
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
        if (this.hazelcastInstance != null) {
            this.hazelcastInstance.shutdown();
        } else {
            LOGGER.debug("Already disabled, so deactivation is a noop");
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int getMemberCount() {
        return this.hazelcastInstance.getCluster().getMembers().size();
    }

}
