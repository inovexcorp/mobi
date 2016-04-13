#ETL REST Services

The org.matonto.etl.rest bundle provides multiple REST endpoints for the ETL of delimited data files. Import and
Export of RDF will be added.

The endpoints can be found at 
```
localhost:8443/matontorest/csv/
```
and 
```
localhost:8443/matontorest/mappings/
```

##Deployment

###Required Bundles
- etl.api-1.0.31-SNAPSHOT
- rdf.impl.sesame-1.0.6
- rest.util-1.0.28
- gson 2.3.1
- opencsv 3.5

###Required Features
- javax.ws.rs-api
- jersey-media-multipart  
- json-lib

##Swagger Spec
The swagger spec for the ETL REST Service can be found at

```
localhost:8443/matontorest/swagger-ui/index.html
```

Point the swagger UI at that URL to view the swagger spec.