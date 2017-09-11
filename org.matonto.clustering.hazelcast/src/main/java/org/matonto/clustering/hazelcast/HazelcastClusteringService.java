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
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ReplicatedMap;
import com.hazelcast.osgi.HazelcastOSGiInstance;
import com.hazelcast.osgi.HazelcastOSGiService;
import org.matonto.clustering.api.ClusteringService;
import org.matonto.clustering.api.ClusteringServiceConfig;
import org.matonto.clustering.hazelcast.config.HazelcastClusteringServiceConfig;
import org.matonto.clustering.hazelcast.config.HazelcastConfigurationFactory;
import org.matonto.clustering.hazelcast.listener.ClusterServiceLifecycleListener;
import org.matonto.exception.MatOntoException;
import org.matonto.platform.config.api.server.MatOnto;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Hashtable;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;
import java.util.concurrent.Semaphore;

/**
 * This is the {@link ClusteringService} implementation built on top of Hazelcast.
 */
@Component(immediate = true,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = HazelcastClusteringServiceConfig.class,
        name = HazelcastClusteringService.NAME,
        properties = {
                "clusteringType=hazelcast"
        },
        provide = {}
)
public class HazelcastClusteringService implements ClusteringService {

    /**
     * Key where we'll store a {@link com.hazelcast.core.ReplicatedMap} of cluster nodes and metadata about them.
     */
    public static final String CLUSTER_MEMBERS_KEY = "cluster.members";

    /**
     * The name of this service type.
     */
    static final String NAME = "org.matonto.clustering.hazelcast";

    /**
     * {@link Logger} for this service.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(HazelcastClusteringService.class);

    /**
     * Core platform service for accessing central server functionality.
     */
    private MatOnto matOntoServer;

    /**
     * {@link HazelcastOSGiService} instance.
     */
    private HazelcastOSGiService hazelcastOSGiService;

    /**
     * Hazelcast instance that will drive the features of this {@link ClusteringService} implementation.
     */
    private HazelcastInstance hazelcastInstance;

    /**
     * Configuration for the Hazelcast instance.
     */
    private Map<String, Object> configuration;

    /**
     * Map of MatOnto nodes currently on the cluster to some metadata about the node.
     */
    private ReplicatedMap<UUID, String> clusterNodes;

    /**
     * Listener for membership changes and lifecycle changes.
     */
    private ClusterServiceLifecycleListener listener;

    /**
     * The task on the {@link ForkJoinPool} representing this service.
     */
    private ForkJoinTask<?> initializationTask;

    /**
     * Service registration if it is necessary.
     */
    private ServiceRegistration<ClusteringService> registration;

    /**
     * Lock to protect the hazelcast instance.
     */
    private Semaphore semaphore = new Semaphore(1, true);

    /**
     * Method that joins the hazelcast cluster when the service is activated.
     */
    @Activate
    void activate(BundleContext context, Map<String, Object> configuration) {
        this.configuration = configuration;
        start();
        this.registration = context.registerService(ClusteringService.class, this, new Hashtable<>(configuration));
    }

    /**
     * Method triggered when the configuration changes for this service.
     *
     * @param configuration The configuration map for this service
     */
    @Modified
    void modified(BundleContext context, Map<String, Object> configuration) {
        LOGGER.warn("Modified configuration of service! Going to deactivate, and re-activate with new configuration...");
        deactivate();
        activate(context, configuration);
    }

    /**
     * Method that spins down the hazelcast instance, leaves the cluster, on deactivation.
     */
    @Deactivate
    void deactivate() {
        stop();
        // Blank out previous configuration.
        this.configuration = null;
        // Unregister previous service.
        if (registration != null) {
            LOGGER.info("Un-registering previously registered service in the OSGi service registry");
            registration.unregister();
            registration = null;
        } else {
            LOGGER.warn("No previously registered service, so we're skipping this deactivation step");
        }
    }


    /**
     * {@inheritDoc}
     */
    @Override
    public void restart() {
        LOGGER.warn("Restarting the service...");
        stop();
        start();
    }

    @Override
    public void start() {
        final HazelcastClusteringServiceConfig serviceConfig = Configurable.createConfigurable(HazelcastClusteringServiceConfig.class, this.configuration);
        if (serviceConfig.enabled()) {
            this.initializationTask = ForkJoinPool.commonPool().submit(() -> {
                this.semaphore.acquireUninterruptibly();
                try {
                    LOGGER.debug("Spinning up underlying hazelcast instance");
                    this.hazelcastInstance = this.hazelcastOSGiService.newHazelcastInstance(HazelcastConfigurationFactory.build(serviceConfig, this.matOntoServer.getServerIdentifier().toString()));
                    LOGGER.info("Clustering Service {}: Successfully initialized Hazelcast instance", this.matOntoServer.getServerIdentifier());
                    // Listen to lifecycle changes...
                    this.listener = new ClusterServiceLifecycleListener();
                    this.hazelcastInstance.getLifecycleService().addLifecycleListener(listener);
                    this.hazelcastInstance.getCluster().addMembershipListener(listener);
                    registerWithClusterNodes(hazelcastInstance);
                } finally {
                    this.semaphore.release();
                }
            });
            LOGGER.info("Successfully spawned initialization thread.");
        } else {
            LOGGER.warn("Clustering Service {}: Service initialized in disabled state... Not going to start a hazelcast node " +
                    "instance and join cluster", this.matOntoServer.getServerIdentifier());
        }

    }

    @Override
    public void stop() {
        // Stop running initialization task.
        LOGGER.info("Going to try and cancel the initialization task if it exists");
        if (initializationTask != null) {
            LOGGER.debug("Initialization task is done: {}", initializationTask.isDone());
            final boolean cancelled = initializationTask.cancel(true);
            LOGGER.debug("Cancelled initialization task: {}, still running: {}", cancelled, initializationTask.isDone());
        } else {
            LOGGER.warn("No initialization task was found... Skipping task cancellation");
        }

        // Shut down the hazelcast instance.

        if (this.hazelcastInstance != null) {
            LOGGER.info("Shutting down underlying hazelcast clustering infrastructure");
            this.hazelcastOSGiService.shutdownHazelcastInstance((HazelcastOSGiInstance) this.hazelcastInstance);
            this.hazelcastInstance.getLifecycleService().terminate();
            LOGGER.debug("Successfully shut down hazelcast clustering infrastructure");
        } else {
            LOGGER.debug("Already disabled, so deactivation is a noop");
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ClusteringServiceConfig getClusteringServiceConfig() {
        return Configurable.createConfigurable(HazelcastClusteringServiceConfig.class, configuration);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int getMemberCount() {
        Optional<HazelcastInstance> optional = getHazelcastInstance();
        if (optional.isPresent()) {
            return optional.get().getCluster().getMembers().size();
        } else {
            return 0;
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Set<UUID> getClusteredNodeIds() {
        return this.clusterNodes.keySet();
    }

    /**
     * Inject the {@link MatOnto} service.
     *
     * @param matOntoServer The service for the platform
     */
    @Reference
    public void setMatOntoServer(MatOnto matOntoServer) {
        this.matOntoServer = matOntoServer;
    }

    /**
     * Inject the {@link HazelcastOSGiService} reference.
     *
     * @param hazelcastOSGiService
     */
    @Reference
    public void setHazelcastOSGiService(HazelcastOSGiService hazelcastOSGiService) {
        this.hazelcastOSGiService = hazelcastOSGiService;
    }

    /**
     * Simple method that will register this node as it comes alive with the cluster registry.
     */
    private void registerWithClusterNodes(final HazelcastInstance hazelcastInstance) {
        this.clusterNodes = hazelcastInstance.getReplicatedMap(CLUSTER_MEMBERS_KEY);
        //TODO - add metadata about this node to the model in the map.
        this.clusterNodes.put(matOntoServer.getServerIdentifier(), "");
    }

    synchronized Optional<HazelcastInstance> getHazelcastInstance() {
        try {
            try {
                this.semaphore.acquire();
                return Optional.ofNullable(this.hazelcastInstance);
            } finally {
                this.semaphore.release();
            }
        } catch (Exception e) {
            throw new MatOntoException("Issue acquiring underlying hazelcast clustering infrastructure", e);
        }

    }
}
