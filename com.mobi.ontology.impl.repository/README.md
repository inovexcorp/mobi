# Mobi Ontology Repository Cache Ontology API Implementation

The repository based Ontology API implementation was created in order to handle large ontologies via pointers to datasets in a repository. This allows for less memory usage when retrieving information from an ontology.

### Configure Repository OntologyCache

The OntologyCache uses a repository implementation to cache ontology objects and can be configured below

```
   id = ontologyCache
   numEntries = 10
   repoId = ontologyCache
   expiry = 1800
   scheduler.expression=0 0 * * * ?
```

The `schedule.expression` is a cron statement that defined when to check the ontology cache for entries that have not been used in the `expiry` period time (in seconds).