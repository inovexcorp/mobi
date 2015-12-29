package org.matonto.ontology.utils.api;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.openrdf.model.URI;

public interface SesameTransformer {

    org.openrdf.model.Statement sesameStatement(Statement statement);

    Statement matontoStatement(org.openrdf.model.Statement statement);

    org.openrdf.model.Resource sesameResource(Resource resource);

    Resource matontoResource(org.openrdf.model.Resource resource);

    URI sesameURI(IRI iri);

    IRI matontoIRI(URI sesameURI);

    org.openrdf.model.Value sesameValue(Value value);

    Value matontoValue(org.openrdf.model.Value value);
}
