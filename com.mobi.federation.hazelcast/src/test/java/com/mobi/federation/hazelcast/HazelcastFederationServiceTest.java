package com.mobi.federation.hazelcast;

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

import static java.lang.Thread.sleep;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.when;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.instance.HazelcastInstanceImpl;
import com.hazelcast.instance.HazelcastInstanceProxy;
import com.hazelcast.instance.Node;
import com.mobi.federation.api.ontologies.federation.FederationNodeFactory;
import com.mobi.federation.utils.api.UserUtils;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.platform.config.api.server.Mobi;
import com.mobi.platform.config.api.server.ServerUtils;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.BooleanValueConverter;
import com.mobi.rdf.orm.conversion.impl.DateValueConverter;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.LiteralValueConverter;
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import org.apache.commons.lang.StringUtils;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Field;
import java.net.InetAddress;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

public class HazelcastFederationServiceTest {

    private static final Logger LOGGER = LoggerFactory.getLogger(HazelcastFederationServiceTest.class);

    private static final int WAIT_TIME = 10;

    private UUID u1 = UUID.randomUUID();
    private UUID u2 = UUID.randomUUID();
    private UUID u3 = UUID.randomUUID();

    @Mock
    private Mobi mobi1;

    @Mock
    private Mobi mobi2;

    @Mock
    private Mobi mobi3;

    @Mock
    private UserUtils userUtils;

    @Mock
    private Engine engine;

    @Mock
    private ConfigurationAdmin configurationAdmin;

    @Mock
    private Configuration configuration;

    @Mock
    private ServerUtils serverUtils;

    @Mock
    private InetAddress localHost;

    private final ValueFactory vf = SimpleValueFactory.getInstance();
    private final ModelFactory mf = LinkedHashModelFactory.getInstance();
    private final ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private final FederationNodeFactory fnf = new FederationNodeFactory();
    private final FakeHazelcastOsgiService hazelcastOSGiService = new FakeHazelcastOsgiService();

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);

        fnf.setModelFactory(mf);
        fnf.setValueFactory(vf);
        fnf.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(fnf);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());
        vcr.registerValueConverter(new BooleanValueConverter());
        vcr.registerValueConverter(new DateValueConverter());

        when(mobi1.getServerIdentifier()).thenReturn(u1);
        when(mobi2.getServerIdentifier()).thenReturn(u2);
        when(mobi3.getServerIdentifier()).thenReturn(u3);
        when(engine.getUsers()).thenReturn(new HashSet<>());
        when(configurationAdmin.getConfiguration(anyString())).thenReturn(configuration);
        when(configuration.getProperties()).thenReturn(new Hashtable<>());
        when(serverUtils.getLocalhost()).thenReturn(localHost);
        when(localHost.getHostAddress()).thenReturn("address");
    }

    @Test
    public void testFederation() throws Exception {
        System.setProperty("hazelcast.logging.type", "slf4j");
        System.setProperty("java.net.preferIPv4Stack", "true");
        final HazelcastFederationService s1 = createService(mobi1);
        final HazelcastFederationService s2 = createService(mobi2);
        final HazelcastFederationService s3 = createService(mobi3);
        ForkJoinPool pool = new ForkJoinPool(3);

        ForkJoinTask<?> task1 = createNode(pool, s1, 5123, new HashSet<>(Arrays.asList("127.0.0.1:5234", "127.0.0.1:5345")));
        ForkJoinTask<?> task2 = createNode(pool, s2, 5234, new HashSet<>(Arrays.asList("127.0.0.1:5123", "127.0.0.1:5345")));
        ForkJoinTask<?> task3 = createNode(pool, s3, 5345, new HashSet<>(Arrays.asList("127.0.0.1:5123", "127.0.0.1:5234")));
        task1.get();
        task2.get();
        task3.get();

        // Test one federation is formed with 3 members
        assertNotNull(s1.getHazelcastInstance());
        assertTrue(s1.getHazelcastInstance().isPresent());
        assertNotNull(s2.getHazelcastInstance());
        assertTrue(s2.getHazelcastInstance().isPresent());
        assertNotNull(s3.getHazelcastInstance());
        assertTrue(s3.getHazelcastInstance().isPresent());

        waitForEquals(3, s1::getMemberCount, WAIT_TIME);
        waitForEquals(3, s2::getMemberCount, WAIT_TIME);
        waitForEquals(3, s3::getMemberCount, WAIT_TIME);
        waitForEquals(s1::getFederationNodeIds, s2::getFederationNodeIds, WAIT_TIME);
        waitForEquals(s1::getFederationNodeIds, s3::getFederationNodeIds, WAIT_TIME);
        waitForEquals(true, () -> s1.getFederationNodeIds().contains(u1), WAIT_TIME);
        waitForEquals(true, () -> s1.getFederationNodeIds().contains(u2), WAIT_TIME);
        waitForEquals(true, () -> s1.getFederationNodeIds().contains(u3), WAIT_TIME);

        // Test deactivation of one node results in two members
        s1.deactivate();
        waitForEquals(2, s2::getMemberCount, WAIT_TIME);
        waitForEquals(2, s3::getMemberCount, WAIT_TIME);
        waitForEquals(true, () -> s3.getFederationNodeIds().contains(u2), WAIT_TIME);
        waitForEquals(true, () -> s3.getFederationNodeIds().contains(u3), WAIT_TIME);

        // Test deactivation of another node results in 1 member
        s2.deactivate();
        waitForEquals(1, s3::getMemberCount, WAIT_TIME);
        waitForEquals(true, () -> s3.getFederationNodeIds().contains(u3), WAIT_TIME);

        // Test reactivation of a node results in two members again
        ForkJoinTask<?> task22 = createNode(pool, s2, 5234, new HashSet<>(Collections.singletonList("127.0.0.1:5345")));
        task22.get();
        waitForEquals(2, s2::getMemberCount, WAIT_TIME);
        waitForEquals(2, s3::getMemberCount, WAIT_TIME);
        waitForEquals(true, () -> s3.getFederationNodeIds().contains(u2), WAIT_TIME);
        waitForEquals(true, () -> s3.getFederationNodeIds().contains(u3), WAIT_TIME);

        // Deactivate remaining nodes
        s2.deactivate();
        s3.deactivate();
    }

    @Test
    public void testDisconnected() throws Exception {
        final HazelcastFederationService s1 = createService(mobi1);
        final HazelcastFederationService s2 = createService(mobi2);
        ForkJoinPool pool = new ForkJoinPool(2);

        ForkJoinTask<?> task1 = createNode(pool, s1, 5123, new HashSet<>(Collections.singletonList("127.0.0.1:5234")));
        ForkJoinTask<?> task2 = createNode(pool, s2, 5234, new HashSet<>(Collections.singletonList("127.0.0.1:5123")));
        task1.get();
        task2.get();

        // Test one federation is formed with 2 members
        assertTrue(s1.getHazelcastInstance().isPresent());
        assertTrue(s2.getHazelcastInstance().isPresent());
        waitForEquals(2, s1::getMemberCount, WAIT_TIME);
        waitForEquals(2, s2::getMemberCount, WAIT_TIME);
        waitForEquals(s1::getFederationNodeIds, s2::getFederationNodeIds, WAIT_TIME);
        waitForEquals(true, () -> s1.getFederationNodeIds().contains(u1), WAIT_TIME);
        waitForEquals(true, () -> s1.getFederationNodeIds().contains(u2), WAIT_TIME);
        waitForEquals(true, () -> s2.getFederationNodeIds().contains(u1), WAIT_TIME);
        waitForEquals(true, () -> s2.getFederationNodeIds().contains(u2), WAIT_TIME);

        HazelcastInstance h1 = s1.getHazelcastInstance().get();
        HazelcastInstance h2 = s2.getHazelcastInstance().get();

        // Test disconnected
        closeConnectionBetween(h1, h2);
        waitForEquals(1, s1::getMemberCount, WAIT_TIME);
        waitForEquals(1, s2::getMemberCount, WAIT_TIME);
        waitForEquals(true, () -> s1.getFederationNodeIds().contains(u1), WAIT_TIME);
        waitForEquals(true, () -> s1.getFederationNodeIds().contains(u2), WAIT_TIME);
        waitForEquals(true, () -> s2.getFederationNodeIds().contains(u1), WAIT_TIME);
        waitForEquals(true, () -> s2.getFederationNodeIds().contains(u2), WAIT_TIME);

        // Test reconnected
        reconnect(h1, h2);
        waitForEquals(2, s1::getMemberCount, WAIT_TIME);
        waitForEquals(2, s2::getMemberCount, WAIT_TIME);
        waitForEquals(true, () -> s1.getFederationNodeIds().contains(u1), WAIT_TIME);
        waitForEquals(true, () -> s1.getFederationNodeIds().contains(u2), WAIT_TIME);
        waitForEquals(true, () -> s2.getFederationNodeIds().contains(u1), WAIT_TIME);
        waitForEquals(true, () -> s2.getFederationNodeIds().contains(u2), WAIT_TIME);

        // Deactivate remaining nodes
        s1.deactivate();
        s2.deactivate();
    }

    private HazelcastFederationService createService(Mobi mobi) {
        HazelcastFederationService service = new HazelcastFederationService();
        service.setMobiServer(mobi);
        service.setFederationNodeFactory(fnf);
        service.setValueFactory(vf);
        service.setHazelcastOSGiService(hazelcastOSGiService);
        service.setRdfEngine(engine);
        service.setUserUtils(userUtils);
        service.setConfigurationAdmin(configurationAdmin);
        service.setServerUtils(serverUtils);
        return service;
    }

    private void waitOnInitialize(HazelcastFederationService s) throws Exception {
        Field f = s.getClass().getDeclaredField("initializationTask");
        f.setAccessible(true);
        ForkJoinTask<?> task = (ForkJoinTask<?>) f.get(s);
        task.get(30, TimeUnit.SECONDS);
    }

    private ForkJoinTask<?> createNode(ForkJoinPool pool, HazelcastFederationService service, int port, Set<String> members) {
        return pool.submit(() -> {
            final Map<String, Object> map = new HashMap<>();
            map.put("id", "test.cluster.service");
            map.put("instanceName", service.hashCode());
            map.put("listeningPort", Integer.toString(port));
            map.put("joinMechanism", "TCPIP");
            map.put("tcpIpMembers", StringUtils.join(members, ", "));
            map.put("sharedKey", "key");
            map.put("maxNoHeartbeatSeconds", 10);
            service.activate(map);
            try {
                waitOnInitialize(service);
            } catch (Exception e) {
                throw new RuntimeException("Issue waiting on service initialization", e);
            }
        });
    }

    private HazelcastInstanceImpl getHazelcastInstanceImpl(HazelcastInstance hz) {
        HazelcastInstanceImpl impl = null;
        if (hz instanceof FakeHazelcastOsgiInstance) {
            HazelcastInstance inst = ((FakeHazelcastOsgiInstance) hz).getDelegatedInstance();
            if (inst instanceof HazelcastInstanceProxy) {
                impl = ((HazelcastInstanceProxy) inst).getOriginal();
            } else if (inst instanceof HazelcastInstanceImpl) {
                impl = (HazelcastInstanceImpl) inst;
            }
        }
        assertNotNull(impl);
        return impl;
    }

    private Node getNode(HazelcastInstance h) {
        Node n = getHazelcastInstanceImpl(h).node;
        assertNotNull(n);
        return n;
    }

    private void closeConnectionBetween(HazelcastInstance h1, HazelcastInstance h2) {
        Node n1 = getNode(h1);
        Node n2 = getNode(h2);
        n1.clusterService.removeAddress(n2.address, null);
        n2.clusterService.removeAddress(n1.address, null);
    }

    private void reconnect(HazelcastInstance h1, HazelcastInstance h2) {
        Node n1 = getNode(h1);
        Node n2 = getNode(h2);
        n1.clusterService.merge(n2.address);
    }

    private void waitForEquals(Supplier<Object> expected, Supplier<Object> actual, int timeoutSeconds) throws InterruptedException {
        while (timeoutSeconds > 0) {
            if (!expected.get().equals(actual.get())) {
                LOGGER.info("Waiting for condition...");
                sleep(1000);
            } else {
                LOGGER.info("Condition passed.");
                return;
            }
            timeoutSeconds--;
        }
        fail("Timeout while waiting for condition.");
    }

    private void waitForEquals(Object expected, Supplier<Object> actual, int timeoutSeconds) throws InterruptedException {
        while (timeoutSeconds > 0) {
            if (!expected.equals(actual.get())) {
                LOGGER.info("Waiting for condition...");
                sleep(1000);
            } else {
                LOGGER.info("Condition passed.");
                return;
            }
            timeoutSeconds--;
        }
        fail("Timeout while waiting for condition.");
    }
}

