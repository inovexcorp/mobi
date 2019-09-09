# Mobi Ontology Repository Cache Ontology API Implementation

The OWLAPI based Ontology API implementation utilizes an in memory object to represent an ontology and the full imports closure of that ontology. This way of handling ontologies as in memory object works well for smaller ontology closures, but as the ontology becomes larger, so does the potential for the in memory objects to hog allocated resources. The repository based Ontology API implementation was created in order to handle large ontologies via pointers to datasets in a repository. This allows for less memory usage when retrieving information from an ontology.

### Add/Remove Configuration Files

In order to switch to the Repository implementation, karaf configuration files must be changed. By default, Mobi comes with the OWLAPI Ontology API implementation. To switch to the Repository Cache implementation delete the old configuration file:

```
   cd ${karaf.home}/etc
   rm com.mobi.ontology.impl.owlapi.OntologyManager.cfg
```

Then create a configuration file for the Repository Cache implementation

```
   touch com.mobi.ontology.impl.repository.OntologyManager.cfg
```

Additionally, create a configuration file for the CacheRepositoryCleanup job:
```
   vim com.mobi.cache.impl.repository.CleanRepositoryCache.cfg
```

Add the following to the file:
```
   repoId = ontologyCache
   expiry = 1800
   scheduler.expression=0 0 * * * ?
```

If you wish to revert back to the OWLAPI implementation, delete the two created files above and restore com.mobi.ontology.impl.owlapi.OntologyManager.cfg


### Clear Out Preexisting Configuration Registration in Karaf

If Mobi had been run with the OWLAPI implementation prior to switching to the Repository Cache implementation, a configuration for that service will have been stored in Karaf. An additional step of removing that configuration object will be necessary.

From the Karaf terminal run:
```
   karaf@mobi()> config:delete com.mobi.ontology.impl.owlapi.OntologyManager
```

If reverting back to the OWLAPI implementation after the Repository Cache implementation had been launched, run the following:

```
   karaf@mobi()> config:delete com.mobi.ontology.impl.repository.OntologyManager
```