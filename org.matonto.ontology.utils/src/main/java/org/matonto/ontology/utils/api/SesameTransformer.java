package org.matonto.ontology.utils.api;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;

public interface SesameTransformer {

    org.openrdf.model.Resource sesameResource(Resource resource);

    org.openrdf.model.URI sesameURI(IRI iri);
}
