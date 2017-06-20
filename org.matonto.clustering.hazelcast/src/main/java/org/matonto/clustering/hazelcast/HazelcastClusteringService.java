package org.matonto.clustering.hazelcast;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Deactivate;
import com.hazelcast.config.Config;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;
import org.apache.commons.lang.StringUtils;
import org.matonto.clustering.api.ClusteringService;
import org.osgi.framework.BundleContext;

@Component
public class HazelcastClusteringService implements ClusteringService {

    /**
     * Hazelcast instance that will drive the features of this {@link ClusteringService} implementation.
     */
    private HazelcastInstance hazelcastInstance;

    /**
     * Hazelcast configuration object, set up by the service configuration.
     */
    private final Config config = new Config();

    /**
     * The bundle context for this service.
     */
    private final BundleContext bundleContext;

    /**
     * Construct a new {@link HazelcastClusteringService} instance.
     *
     * @param context       The {@link BundleContext}
     * @param serviceConfig The {@link HazelcastClusteringServiceConfig} service configuration
     */
    public HazelcastClusteringService(final BundleContext context,
                                      final HazelcastClusteringServiceConfig serviceConfig) {
        this.bundleContext = context;
        if (StringUtils.isNotBlank(serviceConfig.instanceName())) {
            config.setInstanceName(serviceConfig.instanceName());
        }
        if (serviceConfig.basicPort() > 0) {
            config.getNetworkConfig().setPort(serviceConfig.basicPort());
        }
        if (serviceConfig.multicastPort() > 0) {
            config.getNetworkConfig().getJoin().getMulticastConfig().setMulticastPort(serviceConfig.multicastPort());
        }
        if (serviceConfig.outboundPorts() != null && !serviceConfig.outboundPorts().isEmpty()) {
            config.getNetworkConfig().setOutboundPorts(serviceConfig.outboundPorts());
        }
    }

    /**
     * Method that joins the hazelcast cluster when the service is activated.
     */
    @Activate
    public void activate() {
        this.hazelcastInstance = Hazelcast.newHazelcastInstance(config);
    }

    /**
     * Method that spins down the hazelcast instance, leaves the cluster, on deactivation.
     */
    @Deactivate
    public void deactivate() {
        this.hazelcastInstance.shutdown();
    }

}
