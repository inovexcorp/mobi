#ETL REST Services

The org.matonto.etl.rest bundle provides a REST endpoint for the ETL of delimited data files. Import and Export of RDF
will be added.

The endpoint can be found at
```
localhost:8181/etl/csv/
```

##Deployment

###Required Bundles
-etl.api-1.0.0-SNAPSHOT
-Gson 2.4
-opencsv 3.3.0

###Required Features
camel
camel-servlet
camel-blueprint
camel-swagger-java

##Swagger Spec
The swagger spec for the ETL REST Service can be found at

```
localhost:8181/api-docs/etl-context
```

Point the swagger UI at that URL to view the swagger spec.