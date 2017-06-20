package org.matonto.clustering.hazelcast;

import aQute.bnd.annotation.metatype.Meta;
import org.matonto.clustering.api.ClusteringServiceConfig;

import java.util.Set;


public interface HazelcastClusteringServiceConfig extends ClusteringServiceConfig {

    @Meta.AD(required = false)
    String instanceName();

    @Meta.AD(required = false)
    int basicPort();

    @Meta.AD(required = false)
    int multicastPort();

    @Meta.AD(required = false)
    Set<Integer> outboundPorts();

}
