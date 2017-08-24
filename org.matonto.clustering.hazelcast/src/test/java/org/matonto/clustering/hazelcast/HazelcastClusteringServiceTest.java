package org.matonto.clustering.hazelcast;

/*-
 * #%L
 * org.matonto.clustering.hazelcast
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

import junit.framework.TestCase;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.platform.config.api.server.MatOnto;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.runners.MockitoJUnitRunner;
import org.osgi.framework.BundleContext;

import java.util.Arrays;
import java.util.Dictionary;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;

@RunWith(MockitoJUnitRunner.class)
public class HazelcastClusteringServiceTest extends TestCase {

    @Mock
    private MatOnto matOnto1;

    @Mock
    private MatOnto matOnto2;

    @Mock
    private MatOnto matOnto3;

    @Mock
    private BundleContext context;

    @Test
    public void testClustering() throws Exception {
        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();
        UUID u3 = UUID.randomUUID();
        Mockito.when(matOnto1.getServerIdentifier()).thenReturn(u1);
        Mockito.when(matOnto2.getServerIdentifier()).thenReturn(u2);
        Mockito.when(matOnto3.getServerIdentifier()).thenReturn(u3);

        System.setProperty("java.net.preferIPv4Stack", "true");
        final HazelcastClusteringService s1 = new HazelcastClusteringService();
        s1.setMatOntoServer(matOnto1);
        final HazelcastClusteringService s2 = new HazelcastClusteringService();
        s2.setMatOntoServer(matOnto2);
        final HazelcastClusteringService s3 = new HazelcastClusteringService();
        s3.setMatOntoServer(matOnto3);
        ForkJoinPool pool = new ForkJoinPool(3);

        ForkJoinTask<?> task1 = createNode(pool, s1, 5123, new HashSet<>(Arrays.asList("127.0.0.1:5234", "127.0.0.1:5345")));
        ForkJoinTask<?> task2 = createNode(pool, s2, 5234, new HashSet<>(Arrays.asList("127.0.0.1:5123", "127.0.0.1:5345")));
        ForkJoinTask<?> task3 = createNode(pool, s3, 5345, new HashSet<>(Arrays.asList("127.0.0.1:5123", "127.0.0.1:5234")));
        task1.get();
        task2.get();
        task3.get();

        Mockito.verify(context, Mockito.timeout(30000L)
                .times(3))
                .registerService(Mockito.any(Class.class), Mockito.any(HazelcastClusteringService.class), Mockito.any(Dictionary.class));

        Assert.assertNotNull(s1.getHazelcastInstance());
        Assert.assertNotNull(s2.getHazelcastInstance());
        Assert.assertNotNull(s3.getHazelcastInstance());


        assertEquals(3, s1.getMemberCount());
        assertEquals(3, s2.getMemberCount());
        assertEquals(3, s3.getMemberCount());
        assertTrue(CollectionUtils.isEqualCollection(s1.getClusteredNodeIds(), s2.getClusteredNodeIds()));
        assertTrue(CollectionUtils.isEqualCollection(s1.getClusteredNodeIds(), s3.getClusteredNodeIds()));
        assertTrue(s1.getClusteredNodeIds().contains(u1));
        assertTrue(s1.getClusteredNodeIds().contains(u2));
        assertTrue(s1.getClusteredNodeIds().contains(u3));
        s1.getClusteredNodeIds().forEach(System.out::println);

        s1.deactivate();
        assertEquals(2, s2.getMemberCount());
        assertEquals(2, s3.getMemberCount());
        s2.deactivate();
        assertEquals(1, s3.getMemberCount());
        s3.deactivate();
    }

    private void waitOnInitialize(HazelcastClusteringService s) {

    }

    private ForkJoinTask<?> createNode(ForkJoinPool pool, HazelcastClusteringService service, int port, Set<String> members) {
        return pool.submit(() -> {
            final Map<String, Object> map = new HashMap<>();
            map.put("enabled", "true");
            map.put("instanceName", service.hashCode());
            map.put("listeningPort", Integer.toString(port));
            map.put("joinMechanism", "TCPIP");
            map.put("tcpIpMembers", StringUtils.join(members, ", "));
            service.activate(context, map);
        });
    }
}
