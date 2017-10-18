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
import com.hazelcast.config.Config;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ReplicatedMap;
import com.hazelcast.osgi.HazelcastOSGiInstance;
import com.hazelcast.osgi.HazelcastOSGiService;
import com.mobi.federation.utils.api.UserUtils;
import com.mobi.jaas.api.engines.Engine;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import com.mobi.exception.MobiException;
import com.mobi.federation.api.FederationService;
import com.mobi.federation.api.FederationServiceConfig;
import com.mobi.federation.api.ontologies.federation.FederationNode;
import com.mobi.federation.api.ontologies.federation.FederationNodeFactory;
import com.mobi.federation.hazelcast.config.HazelcastConfigurationFactory;
import com.mobi.federation.hazelcast.config.HazelcastFederationServiceConfig;
import com.mobi.federation.hazelcast.listener.FederationServiceLifecycleListener;
import com.mobi.federation.hazelcast.serializable.HazelcastFederationNode;
import com.mobi.jaas.api.utils.TokenUtils;
import com.mobi.platform.config.api.server.Mobi;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;
import java.util.concurrent.Semaphore;
import javax.servlet.http.HttpServletResponse;

/**
 * This is the {@link FederationService} implementation built on top of Hazelcast.
 */
@Component(immediate = true,
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = HazelcastFederationServiceConfig.class,
        name = HazelcastFederationService.NAME,
        properties = {
                "federationType=hazelcast"
        },
        provide = {}
)
public class HazelcastFederationService implements FederationService {

    /**
     * Key where we'll store a {@link com.hazelcast.core.ReplicatedMap} of federated nodes and metadata about them.
     */
    public static final String FEDERATION_NODES_KEY = "federation.nodes";

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
    private ValueFactory vf;
    private FederationNodeFactory federationNodeFactory;
    private UserUtils userUtils;
    private Engine rdfEngine;

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
    private ReplicatedMap<UUID, HazelcastFederationNode> federationNodes;

    /**
     * Listener for membership changes and lifecycle changes.
     */
    private FederationServiceLifecycleListener listener;

    /**
     * The task on the {@link ForkJoinPool} representing this service.
     */
    private ForkJoinTask<?> initializationTask;

    /**
     * Service registration if it is necessary.
     */
    private ServiceRegistration<FederationService> registration;

    /**
     * Lock to protect the hazelcast instance.
     */
    private Semaphore semaphore = new Semaphore(1, true);

    /**
     * The unique key to generate and verify federation tokens.
     */
    private byte[] tokenKey;

    /**
     * Encryptor needed to decrypt the configuration's sharedKey to properly populate the tokenKey.
     */
    private StandardPBEStringEncryptor encryptor = FederationService.getEncryptor();

    @Reference
    void setMobiServer(Mobi mobiServer) {
        this.mobiServer = mobiServer;
    }

    @Reference
    void setHazelcastOSGiService(HazelcastOSGiService hazelcastOSGiService) {
        this.hazelcastOSGiService = hazelcastOSGiService;
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        this.vf = valueFactory;
    }

    @Reference
    void setFederationNodeFactory(FederationNodeFactory federationNodeFactory) {
        this.federationNodeFactory = federationNodeFactory;
    }

    @Reference
    void setUserUtils(UserUtils userUtils) {
        this.userUtils = userUtils;
    }

    @Reference(target = "(engineName=RdfEngine)")
    protected void setRdfEngine(Engine engine) {
        this.rdfEngine = engine;
    }

    /**
     * Method that joins the hazelcast federation when the service is activated.
     */
    @Activate
    void activate(BundleContext context, Map<String, Object> configuration) {
        this.configuration = configuration;
        start();
        this.registration = context.registerService(FederationService.class, this, new Hashtable<>(configuration));
    }

    /**
     * Method triggered when the configuration changes for this service.
     *
     * @param configuration The configuration map for this service
     */
    @Modified
    void modified(BundleContext context, Map<String, Object> configuration) {
        LOGGER.warn("Modified configuration of service! Going to deactivate, and re-activate with new"
                + " configuration...");
        deactivate();
        activate(context, configuration);
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
                Config config = HazelcastConfigurationFactory.build(serviceConfig,
                        this.mobiServer.getServerIdentifier().toString());
                config.setClassLoader(getClass().getClassLoader());
                this.hazelcastInstance = this.hazelcastOSGiService.newHazelcastInstance(config);
                LOGGER.info("Federation Service {}: Successfully initialized Hazelcast instance",
                        this.mobiServer.getServerIdentifier());
                // Listen to lifecycle changes...
                this.listener = new FederationServiceLifecycleListener();
                this.hazelcastInstance.getLifecycleService().addLifecycleListener(listener);
                this.hazelcastInstance.getCluster().addMembershipListener(listener);
                this.tokenKey = encryptor.decrypt(serviceConfig.sharedKey()).getBytes(StandardCharsets.UTF_8);
                registerWithFederationNodes(hazelcastInstance);
                registerUsers();
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
            String federationId = getFederationId();
            UUID nodeId = getNodeId();
            if (nodeId == null) {
                LOGGER.warn("Unable to retrieve node ID from hazelcast instance: {}.", federationId);
            } else {
                if (this.federationNodes == null) {
                    LOGGER.info("Attempting to retrieve distributed data structure for federation: {} on node: {}.",
                            federationId, nodeId);
                    this.federationNodes = this.hazelcastInstance.getReplicatedMap(FEDERATION_NODES_KEY);
                }
                if (this.federationNodes == null) {
                    LOGGER.warn("Unable to access distributed data structure for federation: {} on node: {}.",
                            federationId, nodeId);
                } else {
                    try {
                        HazelcastFederationNode node = this.federationNodes.get(nodeId);
                        if (node != null) {
                            node.setNodeActive(false);
                            node.setNodeLastUpdated(OffsetDateTime.now());
                            this.federationNodes.replace(nodeId, node);
                        } else {
                            LOGGER.warn("No node found with id: {} in distributed data structure.", nodeId);
                        }
                    } catch (Exception e) {
                        LOGGER.error("Unable to update status for node: {} on federation: {}", nodeId, federationId, e);
                    }
                }
            }

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
    public String getFederationId() {
        return this.configuration.get("id").toString();
    }

    @Override
    public UUID getNodeId() {
        return this.mobiServer.getServerIdentifier();
    }

    @Override
    public String getNodeRESTEndpoint(UUID nodeId) {
        HazelcastFederationNode node = this.federationNodes.get(nodeId);
        return String.format(NODE_REST_ENDPOINT, node.getHost());
    }

    @Override
    public Optional<FederationNode> getMetadataForNode(String nodeId) {
        Optional<FederationNode> optNode = Optional.empty();
        HazelcastFederationNode hfn = this.federationNodes.get(UUID.fromString(nodeId));
        if (hfn != null) {
            optNode = Optional.of(HazelcastFederationNode.getAsFederationNode(hfn, federationNodeFactory, vf));
        }
        return optNode;
    }

    @Override
    public <K, V> Map<K, V> getDistributedMap(String mapId) {
        Optional<HazelcastInstance> hazelcastInstance = getHazelcastInstance();
        if (!hazelcastInstance.isPresent()) {
            return null;
        }
        return hazelcastInstance.get().getReplicatedMap(mapId);
    }

    @Override
    public Set<UUID> getFederationNodeIds() {
        if (this.federationNodes == null) {
            return Collections.emptySet();
        }
        return this.federationNodes.keySet();
    }

    @Override
    public SignedJWT generateToken(HttpServletResponse res, String username) throws IOException {
        Map<String, Object> claims = new HashMap<>();
        claims.put("federationId", getFederationId());
        claims.put("nodeId", getNodeId().toString());
        return TokenUtils.generateToken(res, username, FEDERATION_SCOPE, tokenKey, claims);
    }

    @Override
    public Optional<SignedJWT> verifyToken(String tokenString) throws ParseException, JOSEException {
        return TokenUtils.verifyToken(tokenString, tokenKey);
    }

    @Override
    public Optional<SignedJWT> verifyToken(String tokenString, HttpServletResponse res) throws IOException {
        return TokenUtils.verifyToken(tokenString, res, tokenKey);
    }

    /**
     * Simple method that will register this node as it comes alive with the federation registry.
     */
    private void registerWithFederationNodes(final HazelcastInstance hazelcastInstance) {
        try {
            this.federationNodes = hazelcastInstance.getReplicatedMap(FEDERATION_NODES_KEY);
            String iri = FederationService.getNodeIri(getFederationId(), getNodeId().toString());
            IRI fedNodeIri = vf.createIRI(iri);
            FederationNode node = federationNodeFactory.createNew(fedNodeIri);
            node.setNodeId(getNodeId().toString());
            node.setNodeActive(Boolean.TRUE);
            node.setNodeLastUpdated(OffsetDateTime.now());
            getHostAddress().ifPresent(node::setHost);

            //TODO - add remaining metadata about this node.
            this.federationNodes.put(getNodeId(), new HazelcastFederationNode(node));
        } catch (UnsupportedEncodingException e) {
            LOGGER.warn("Unable to create Node IRI for: " + getNodeId(), e);
        }
    }

    /**
     * Simple method that will initialize the user map and add all current users to the map for this service.
     */
    private void registerUsers() {
        userUtils.createMapEntry(this);
        rdfEngine.getUsers().forEach(user -> userUtils.addUser(this, user));
    }

    private Optional<String> getHostAddress() {
        Optional<String> rtn = Optional.empty();

        try {
            Collection<InetAddress> addresses = getAllLocalAddresses();
            Optional<InetAddress> optIA = addresses.stream().filter(ia -> ia instanceof Inet4Address).findFirst();
            if (optIA.isPresent()) {
                rtn = Optional.of(optIA.get().getHostAddress());
            }
        } catch (SocketException e) {
            LOGGER.error("Unable to get local host address", e);
        }
        return rtn;
    }

    private Collection<InetAddress> getAllLocalAddresses() throws SocketException {
        Collection<InetAddress> addresses = new HashSet<>();
        Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
        while (networkInterfaces.hasMoreElements()) {
            NetworkInterface ni = networkInterfaces.nextElement();
            Enumeration<InetAddress> nias = ni.getInetAddresses();
            while (nias.hasMoreElements()) {
                InetAddress ia = nias.nextElement();
                if (!ia.isLinkLocalAddress() && !ia.isLoopbackAddress()) {
                    addresses.add(ia);
                }
            }
        }
        return addresses;
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
