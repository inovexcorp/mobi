package com.mobi.federation.hazelcast;

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
import com.mobi.exception.MobiException;
import com.mobi.federation.api.FederationService;
import com.mobi.federation.api.FederationServiceConfig;
import com.mobi.federation.hazelcast.config.HazelcastConfigurationFactory;
import com.mobi.federation.hazelcast.listener.FederationServiceLifecycleListener;
import com.mobi.federation.hazelcast.config.HazelcastFederationServiceConfig;
import com.mobi.platform.config.api.server.Mobi;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.Hashtable;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;
import java.util.concurrent.Semaphore;

/**
 * This is the {@link FederationService} implementation built on top of Hazelcast.
 */
@Component(immediate = true,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = HazelcastFederationServiceConfig.class,
        name = HazelcastFederationService.NAME,
        properties = {
                "federationType=hazelcast"
        }
)
public class HazelcastFederationService implements FederationService {

    /**
     * Key where we'll store a {@link com.hazelcast.core.ReplicatedMap} of federated nodes and metadata about them.
     */
    public static final String FEDERATION_MEMBERS_KEY = "federation.members";

    /**
     * The name of this service type.
     */
    static final String NAME = "com.mobi.federation.hazelcast";

    /**
     * {@link Logger} for this service.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(HazelcastFederationService.class);

    /**
     * Core platform service for accessing central server functionality.
     */
    private Mobi mobiServer;

    /**
     * {@link HazelcastOSGiService} instance.
     */
    private HazelcastOSGiService hazelcastOSGiService;

    /**
     * Hazelcast instance that will drive the features of this {@link FederationService} implementation.
     */
    private HazelcastInstance hazelcastInstance;

    /**
     * Configuration for the Hazelcast instance.
     */
    private Map<String, Object> configuration;

    /**
     * Map of Mobi nodes currently in the federation to some metadata about the node.
     */
    private ReplicatedMap<UUID, String> federationNodes;

    /**
     * Listener for membership changes and lifecycle changes.
     */
    private FederationServiceLifecycleListener listener;

    /**
     * The task on the {@link ForkJoinPool} representing this service.
     */
    private ForkJoinTask<?> initializationTask;

    /**
     * Lock to protect the hazelcast instance.
     */
    private Semaphore semaphore = new Semaphore(1, true);

    @Reference
    void setMobiServer(Mobi mobiServer) {
        this.mobiServer = mobiServer;
    }

    @Reference
    void setHazelcastOSGiService(HazelcastOSGiService hazelcastOSGiService) {
        this.hazelcastOSGiService = hazelcastOSGiService;
    }

    /**
     * Method that joins the hazelcast federation when the service is activated.
     */
    @Activate
    void activate(Map<String, Object> configuration) {
        this.configuration = configuration;
        start();
    }

    /**
     * Method triggered when the configuration changes for this service.
     *
     * @param configuration The configuration map for this service
     */
    @Modified
    void modified(Map<String, Object> configuration) {
        LOGGER.warn("Modified configuration of service! Going to deactivate, and re-activate with new"
                + " configuration...");
        deactivate();
        activate(configuration);
    }

    /**
     * Method that spins down the hazelcast instance, leaves the federation, on deactivation.
     */
    @Deactivate
    void deactivate() {
        stop();
    }

    @Override
    public void restart() {
        LOGGER.warn("Restarting the service...");
        stop();
        start();
    }

    @Override
    public void start() {
        final HazelcastFederationServiceConfig serviceConfig =
                Configurable.createConfigurable(HazelcastFederationServiceConfig.class, this.configuration);
        this.initializationTask = ForkJoinPool.commonPool().submit(() -> {
            this.semaphore.acquireUninterruptibly();
            try {
                LOGGER.debug("Spinning up underlying hazelcast instance");
                this.hazelcastInstance = this.hazelcastOSGiService
                        .newHazelcastInstance(HazelcastConfigurationFactory.build(serviceConfig,
                                this.mobiServer.getServerIdentifier().toString()));
                LOGGER.info("Federation Service {}: Successfully initialized Hazelcast instance",
                        this.mobiServer.getServerIdentifier());
                // Listen to lifecycle changes...
                this.listener = new FederationServiceLifecycleListener();
                this.hazelcastInstance.getLifecycleService().addLifecycleListener(listener);
                this.hazelcastInstance.getCluster().addMembershipListener(listener);
                registerWithFederationNodes(hazelcastInstance);
            } finally {
                this.semaphore.release();
            }
        });
        LOGGER.info("Successfully spawned initialization thread.");
    }

    @Override
    public void stop() {
        // Stop running initialization task.
        LOGGER.info("Going to try and cancel the initialization task if it exists");
        if (initializationTask != null) {
            LOGGER.debug("Initialization task is done: {}", initializationTask.isDone());
            final boolean cancelled = initializationTask.cancel(true);
            LOGGER.debug("Cancelled initialization task: {}, still running: {}", cancelled,
                    initializationTask.isDone());
        } else {
            LOGGER.warn("No initialization task was found... Skipping task cancellation");
        }

        // Shut down the hazelcast instance.
        if (this.hazelcastInstance != null) {
            LOGGER.info("Shutting down underlying hazelcast federation infrastructure");
            this.hazelcastOSGiService.shutdownHazelcastInstance((HazelcastOSGiInstance) this.hazelcastInstance);
            this.hazelcastInstance.getLifecycleService().terminate();
            LOGGER.debug("Successfully shut down hazelcast federation infrastructure");
        } else {
            LOGGER.debug("Already disabled, so deactivation is a noop");
        }
    }

    @Override
    public FederationServiceConfig getFederationServiceConfig() {
        return Configurable.createConfigurable(HazelcastFederationServiceConfig.class, configuration);
    }

    @Override
    public int getMemberCount() {
        Optional<HazelcastInstance> optional = getHazelcastInstance();
        return optional.map(hazelcastInstance -> hazelcastInstance.getCluster().getMembers().size()).orElse(0);
    }

    @Override
    public Set<UUID> getFederationNodeIds() {
        if (this.federationNodes == null) {
            return Collections.emptySet();
        }
        return this.federationNodes.keySet();
    }

    /**
     * Simple method that will register this node as it comes alive with the federation registry.
     */
    private void registerWithFederationNodes(final HazelcastInstance hazelcastInstance) {
        this.federationNodes = hazelcastInstance.getReplicatedMap(FEDERATION_MEMBERS_KEY);
        //TODO - add metadata about this node to the model in the map.
        this.federationNodes.put(mobiServer.getServerIdentifier(), "");
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
            throw new MobiException("Issue acquiring underlying hazelcast federation infrastructure", e);
        }
    }
}
