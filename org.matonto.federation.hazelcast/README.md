# Hazelcast Federation Implementation
This bundle provides a federation service implementation built upon the open source Hazelcast framework. The Hazelcast library is used to discover and communicate with other nodes.

## Configuration
To configure your platform for federation, you must alter the *org.matonto.federation.hazelcast-system.cfg* file in your distribution's etc/ directory. The *enabled* property tells it whether the federation mechanisms should be turned on or off.  If off (false), then the service will not discover and connect to other nodes.

See HazelcastFederationServiceConfig for the various configuration options available for customization of your HazelcastFederationService instance.

## Supported Discovery Methods
Hazelcast supports several mechanisms for discovering and connecting to remote nodes. For more information, check out the Hazelcast Manual (http://docs.hazelcast.org/docs/3.8.2/manual/html-single/index.html).
