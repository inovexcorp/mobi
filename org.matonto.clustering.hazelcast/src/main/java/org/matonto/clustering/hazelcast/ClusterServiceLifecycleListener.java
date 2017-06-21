package org.matonto.clustering.hazelcast;

import com.hazelcast.core.LifecycleEvent;
import com.hazelcast.core.LifecycleListener;

/**
 * This {@link LifecycleListener} implementation provides hooks for the {@link HazelcastClusteringService} implementation
 * of the {@link org.matonto.clustering.api.ClusteringService} to listen to changes in the cluster.
 */
public class ClusterServiceLifecycleListener implements LifecycleListener {

    @Override
    public void stateChanged(LifecycleEvent event) {

    }
}
