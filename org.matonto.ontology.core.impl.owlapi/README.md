# Matonto Ontology Core Owlapi Impl - 1.0.0.SNAPSHOT 

## OSGI bundle setup 

### Dependency requirements 
     		
| Dependency Name | Dependency Version | 
| --------------- | ---------------- | 
| owlapi-distribution | 4.1.4.SNAPSHOT
| OpenRDF Sesame: Runtime - OSGi | 2.8



### Set repository ID on Karaf commandline commands as following:
```
config:edit OntologyManager
config:property-set repositoryId "{repositoryId in the repository config file}"
config:update

```

After these commands, check to see if it's activated as following 
``
scr:list
``