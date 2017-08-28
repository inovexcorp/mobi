package org.matonto.clustering.hazelcast;

import com.hazelcast.config.Config;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.osgi.HazelcastOSGiInstance;
import com.hazelcast.osgi.HazelcastOSGiService;
import org.osgi.framework.Bundle;

import java.util.Set;

public class FakeHazelcastOsgiService implements HazelcastOSGiService {

    @Override
    public String getId() {
        return null;
    }

    @Override
    public Bundle getOwnerBundle() {
        return null;
    }

    @Override
    public HazelcastOSGiInstance getDefaultHazelcastInstance() {
        return new FakeHazelcastOsgiInstance(Hazelcast.newHazelcastInstance(), this);
    }

    @Override
    public HazelcastOSGiInstance newHazelcastInstance(Config config) {
        return new FakeHazelcastOsgiInstance(Hazelcast.newHazelcastInstance(config), this);
    }

    @Override
    public HazelcastOSGiInstance newHazelcastInstance() {
        return null;
    }

    @Override
    public HazelcastOSGiInstance getHazelcastInstanceByName(String instanceName) {
        return null;
    }

    @Override
    public Set<HazelcastOSGiInstance> getAllHazelcastInstances() {
        return null;
    }

    @Override
    public void shutdownHazelcastInstance(HazelcastOSGiInstance instance) {

    }

    @Override
    public void shutdownAll() {

    }
}
