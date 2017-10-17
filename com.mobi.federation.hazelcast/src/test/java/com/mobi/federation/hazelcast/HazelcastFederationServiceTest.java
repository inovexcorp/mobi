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

import com.mobi.federation.api.FederationUserUtils;
import com.mobi.jaas.api.engines.Engine;
import junit.framework.TestCase;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import com.mobi.federation.api.FederationService;
import com.mobi.federation.api.ontologies.federation.FederationNodeFactory;
import com.mobi.platform.config.api.server.Mobi;
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
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.runners.MockitoJUnitRunner;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.Collections;
import java.util.Dictionary;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;
import java.util.concurrent.TimeUnit;

@RunWith(MockitoJUnitRunner.class)
public class HazelcastFederationServiceTest extends TestCase {

    @Mock
    private Mobi mobi1;

    @Mock
    private Mobi mobi2;

    @Mock
    private Mobi mobi3;

    @Mock
    private BundleContext context;

    @Mock
    private ServiceRegistration<FederationService> registration;

    @Mock
    private FederationUserUtils userUtils;

    @Mock
    private Engine engine;

    private final ValueFactory vf = SimpleValueFactory.getInstance();
    private final ModelFactory mf = LinkedHashModelFactory.getInstance();
    private final ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private final FederationNodeFactory fnf = new FederationNodeFactory();

    @Test
    public void testFederation() throws Exception {
        final FakeHazelcastOsgiService hazelcastOSGiService = new FakeHazelcastOsgiService();

        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();
        UUID u3 = UUID.randomUUID();
        Mockito.when(mobi1.getServerIdentifier()).thenReturn(u1);
        Mockito.when(mobi2.getServerIdentifier()).thenReturn(u2);
        Mockito.when(mobi3.getServerIdentifier()).thenReturn(u3);
        Mockito.when(context.registerService(Mockito.eq(FederationService.class), Mockito.any(FederationService.class), Mockito.any()))
                .thenReturn(registration);
        Mockito.when(engine.getUsers()).thenReturn(Collections.EMPTY_SET);

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

        System.setProperty("java.net.preferIPv4Stack", "true");
        final HazelcastFederationService s1 = new HazelcastFederationService();
        s1.setMobiServer(mobi1);
        s1.setFederationNodeFactory(fnf);
        s1.setValueFactory(vf);
        s1.setHazelcastOSGiService(hazelcastOSGiService);
        s1.setRdfEngine(engine);
        s1.setFederationUserUtils(userUtils);
        final HazelcastFederationService s2 = new HazelcastFederationService();
        s2.setMobiServer(mobi2);
        s2.setFederationNodeFactory(fnf);
        s2.setValueFactory(vf);
        s2.setHazelcastOSGiService(hazelcastOSGiService);
        s2.setRdfEngine(engine);
        s2.setFederationUserUtils(userUtils);
        final HazelcastFederationService s3 = new HazelcastFederationService();
        s3.setMobiServer(mobi3);
        s3.setFederationNodeFactory(fnf);
        s3.setValueFactory(vf);
        s3.setHazelcastOSGiService(hazelcastOSGiService);
        s3.setRdfEngine(engine);
        s3.setFederationUserUtils(userUtils);
        ForkJoinPool pool = new ForkJoinPool(3);

        ForkJoinTask<?> task1 = createNode(pool, s1, 5123, new HashSet<>(Arrays.asList("127.0.0.1:5234", "127.0.0.1:5345")));
        ForkJoinTask<?> task2 = createNode(pool, s2, 5234, new HashSet<>(Arrays.asList("127.0.0.1:5123", "127.0.0.1:5345")));
        ForkJoinTask<?> task3 = createNode(pool, s3, 5345, new HashSet<>(Arrays.asList("127.0.0.1:5123", "127.0.0.1:5234")));
        task1.get();
        task2.get();
        task3.get();

        Mockito.verify(context, Mockito.timeout(30000L)
                .times(3))
                .registerService(Mockito.any(Class.class), Mockito.any(HazelcastFederationService.class), Mockito.any(Dictionary.class));

        Assert.assertNotNull(s1.getHazelcastInstance());
        Assert.assertNotNull(s2.getHazelcastInstance());
        Assert.assertNotNull(s3.getHazelcastInstance());

        assertEquals(3, s1.getMemberCount());
        assertEquals(3, s2.getMemberCount());
        assertEquals(3, s3.getMemberCount());
        assertTrue(CollectionUtils.isEqualCollection(s1.getFederationNodeIds(), s2.getFederationNodeIds()));
        assertTrue(CollectionUtils.isEqualCollection(s1.getFederationNodeIds(), s3.getFederationNodeIds()));
        assertTrue(s1.getFederationNodeIds().contains(u1));
        assertTrue(s1.getFederationNodeIds().contains(u2));
        assertTrue(s1.getFederationNodeIds().contains(u3));
        s1.getFederationNodeIds().forEach(System.out::println);

        s1.deactivate();
        Thread.sleep(500L);
        assertEquals(2, s2.getMemberCount());
        assertEquals(2, s3.getMemberCount());
        s2.deactivate();
        Thread.sleep(500L);
        assertEquals(1, s3.getMemberCount());
        s3.deactivate();
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
            map.put("sharedKey", FederationService.getEncryptor().encrypt("key"));
            service.activate(context, map);
            try {
                waitOnInitialize(service);
            } catch (Exception e) {
                throw new RuntimeException("Issue waiting on service initialization", e);
            }
        });
    }
}

