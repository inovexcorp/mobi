# Ontology REST

## Configuration

Karaf Deployment:

```
feature:repo-add mvn:com.eclipsesource.jaxrs/features/5.3/xml/features
feature:install scr http
feature:install jax-rs-connector jax-rs-provider-multipart jax-rs-provider-swagger
```