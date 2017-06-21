package org.matonto.clustering.hazelcast;

import junit.framework.TestCase;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinTask;

@RunWith(BlockJUnit4ClassRunner.class)
public class TestHazelcastClusteringService extends TestCase {


    @Test
    public void basicTest() throws Exception {
        System.setProperty("java.net.preferIPv4Stack", "true");
        final HazelcastClusteringService s1 = new HazelcastClusteringService();
        final HazelcastClusteringService s2 = new HazelcastClusteringService();
        final HazelcastClusteringService s3 = new HazelcastClusteringService();

        ForkJoinPool pool = new ForkJoinPool(5);
        ForkJoinTask<?> task1 = pool.submit(() -> {
            Map<String, Object> map = new HashMap<>();
            map.put("instanceName", "instance01");
            map.put("basicPort", 5701);
            map.put("multicastPort", 54327);
            map.put("multicastGroup", "224.0.0.1");
            s1.activate(null, map);
        });

        ForkJoinTask<?> task2 = pool.submit(() -> {
            Map<String, Object> map = new HashMap<>();
            map.put("instanceName", "instance02");
            map.put("multicastPort", 54327);
            map.put("basicPort", 5702);
            map.put("multicastGroup", "224.0.0.1");
            s2.activate(null, map);
        });

        ForkJoinTask<?> task3 = pool.submit(() -> {
            Map<String, Object> map = new HashMap<>();
            map.put("instanceName", "instance03");
            map.put("multicastPort", 54327);
            map.put("basicPort", 5703);
            map.put("multicastGroup", "224.0.0.1");
            s3.activate(null, map);
        });

        task1.get();
        task2.get();
        task3.get();
        assertEquals(3, s1.getMemberCount());
        assertEquals(3, s2.getMemberCount());
        assertEquals(3, s3.getMemberCount());
    }

}
