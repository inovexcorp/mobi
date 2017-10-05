# Mobi Persistence API

## Mobi Repository API

The Mobi Repository API provides access to triplestores for storing, retrieving, and querying RDF data.

### Mobi Repository Sesame Implementation

The Repository Sesame Impl provides Mobi Repositories via an OSGi Service backed by Sesame implementations. The repository implementation services will create Repository instances for each associated configuration. The configurations follow the factory-configuration model, where each configuration file is prefixed with the appropriate factory-pid. The currently supported Repository types are:

| Repository Type | Providing Module | Factory-PID |
| --------------- | ---------------- | ----------- |
| memory | org.matonto.rdf.impl.sesame | org.matonto.service.repository.memory |
| native | org.matonto.rdf.impl.sesame | org.matonto.service.repository.native |

### Configuring Repository Services

Each repository serivce designates a configuration class for configuration properties. The mappings are shown below:

| Repository Type | Configuration Class |
| --------------- | ------------------- |
| memory | org.matonto.repository.impl.sesame.memory.MemoryRepositoryConfig |
| native | org.matonto.repository.impl.sesame.native.NativeRepositoryConfig |

#### Memory Repository Configuration

Configuration file must begin with `org.matonto.service.repository.memory`. For example `org.matonto.service.repository.memory-test.cfg`.

```
# Memory Repo Settings
# Note: dataDir is optional. This is only needed for persistence.
id = test-repo
title = "Test Repository"
dataDir = /data/memory1
```

### Referencing Repository Services

Repository services are published to the service registry via Declarative Services. They can be referenced via Blueprints like so:
 
```xml
<reference id="repo" interface="org.openrdf.repository.Repository" filter="(repositorytype=memory)"/>
```
    
and via Declarative Services via a Reference annotation:

```java
@Reference(target = "(repositorytype=memory)")
public void setRepository(Repository repository) { this.repository = repository; }
```
    