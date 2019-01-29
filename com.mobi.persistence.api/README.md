# Mobi Persistence API

## Mobi Repository API

The Mobi Repository API provides access to triplestores for storing, retrieving, and querying RDF data.

### Mobi Repository Sesame Implementation

The Repository Sesame Impl provides Mobi Repositories via an OSGi Service backed by Sesame implementations. The repository implementation services will create Repository instances for each associated configuration. The configurations follow the factory-configuration model, where each configuration file is prefixed with the appropriate factory-pid. The currently supported Repository types are:

| Repository Type | Providing Module | Factory-PID |
| --------------- | ---------------- | ----------- |
| memory | com.mobi.rdf.impl.sesame | com.mobi.service.repository.memory |
| native | com.mobi.rdf.impl.sesame | com.mobi.service.repository.native |
| sparql | com.mobi.rdf.impl.sesame | com.mobi.service.repository.sparql |
| http | com.mobi.rdf.impl.sesame | com.mobi.service.repository.http |

### Configuring Repository Services

Each repository serivce designates a configuration class for configuration properties. The mappings are shown below:

| Repository Type | Configuration Class |
| --------------- | ------------------- |
| memory | com.mobi.repository.impl.sesame.memory.MemoryRepositoryConfig |
| native | com.mobi.repository.impl.sesame.native.NativeRepositoryConfig |
| sparql | com.mobi.repository.impl.sesame.sparql.SPARQLRepositoryConfig |
| http | com.mobi.repository.impl.sesame.http.HTTPRepositoryConfig |

#### Memory Repository Configuration

Configuration file must begin with `com.mobi.service.repository.memory`. For example `com.mobi.service.repository.memory-test.cfg`.

```
# Memory Repo Settings
# Note: dataDir is optional. This is only needed for persistence.
id = test-repo
title = "Test Repository"
dataDir = /data/test-repo
```

#### Native Repository Configuration

Configuration file must begin with `com.mobi.service.repository.native`. For example `com.mobi.service.repository.native-test.cfg`.

```
# Native Repo Settings
id = test-repo
title = "Test Repository"
dataDir = /data/test-repo
```

#### SPARQL Repository Configuration

Configuration file must begin with `com.mobi.service.repository.sparql`. For example `com.mobi.service.repository.sparql-test.cfg`.

```
# SPARQL Repo Settings
id = test-repo
title = "Test Repository"
endpointUrl = http://mydb.com/sparql
updateEndpointUrl = http://mydb.com/sparql/statements
```

#### HTTP Repository Configuration

Configuration file must begin with `com.mobi.service.repository.http`. For example `com.mobi.service.repository.http-test.cfg`.

```
# HTTP Repo Settings
id = test-repo
title = "Test Repository"
serverUrl = http://mydb.com/server-url
```

### Referencing Repository Services

Repository services are published to the service registry via Declarative Services. They can be referenced via Blueprints like so:
 
```xml
<reference id="repo" interface="org.eclipse.rdf4j.repository.Repository" filter="(repositorytype=memory)"/>
```
    
and via Declarative Services via a Reference annotation:

```java
@Reference(target = "(repositorytype=memory)")
public void setRepository(Repository repository) { this.repository = repository; }
```

References can also be made targeting specific repositories by ID. For example:

```java
@Reference(target = "(id=system)")
public void setRepository(Repository repository) { this.repository = repository; }
```
    