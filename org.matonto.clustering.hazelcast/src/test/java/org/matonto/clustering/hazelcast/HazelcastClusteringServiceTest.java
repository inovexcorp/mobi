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
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;

@RunWith(BlockJUnit4ClassRunner.class)
public class HazelcastClusteringServiceTest extends TestCase {

    private static String MULTICAST_GROUP = null;

    @BeforeClass
    public static void init() {
        String osName = System.getProperty("os.name");
        if (osName.contains("Mac") || osName.contains("Linux")) {
            MULTICAST_GROUP = "224.0.0.1";
        }
    }

    @Test
    public void testClustering() throws Exception {
        System.setProperty("java.net.preferIPv4Stack", "true");
        final HazelcastClusteringService s1 = new HazelcastClusteringService();
        final HazelcastClusteringService s2 = new HazelcastClusteringService();
        final HazelcastClusteringService s3 = new HazelcastClusteringService();

        ForkJoinPool pool = new ForkJoinPool(3);

        ForkJoinTask<?> task1 = createNode(pool, s1, 5701);
        ForkJoinTask<?> task2 = createNode(pool, s2, 5702);
        ForkJoinTask<?> task3 = createNode(pool, s3, 5703);


        task1.get();
        task2.get();
        task3.get();
        assertEquals(3, s1.getMemberCount());
        assertEquals(3, s2.getMemberCount());
        assertEquals(3, s3.getMemberCount());
        s1.deactivate();
        assertEquals(2, s2.getMemberCount());
        assertEquals(2, s3.getMemberCount());
        s2.deactivate();
        assertEquals(1, s3.getMemberCount());
        s3.deactivate();
    }

    private ForkJoinTask<?> createNode(ForkJoinPool pool, HazelcastClusteringService service, int port) {
        return pool.submit(() -> {
            Map<String, Object> map = new HashMap<>();
            map.put("instanceName", service.hashCode());
            map.put("basicPort", port);
            map.put("multicastPort", 54326);
            if (MULTICAST_GROUP != null) {
                map.put("multicastGroup", MULTICAST_GROUP);
            }
            service.activate(null, map);
        });
    }

}
