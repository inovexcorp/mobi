# Hazelcast Clustering Implementation
This bundle provides a clustering service implementation built upon the open source
Hazelcast framework.  Essentially, we will use the Hazelcast library to discovery and
communicate with other nodes.

## Configuration
To configure your platform for clustering, you must alter the 
*org.matonto.clustering.hazelcast-system.cfg* file in your distribution's etc/ directory.
The *enabled* property tells it whether the clustering mechanisms should be turned on
or off.  If off, then the service will not discover and connect to other nodes.

## Supported Discovery Methods
Hazelcast supports several mechanisms for discovering and connecting to remote nodes.
For more information, check out the Hazelcast Manual 
(http://docs.hazelcast.org/docs/3.8.2/manual/html-single/index.html).