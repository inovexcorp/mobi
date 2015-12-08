package org.matonto.ontology.core.api;

import org.openrdf.model.Resource;

import com.google.common.base.Optional;


public interface OntologyId {

	Optional<OntologyIRI> getOntologyIRI();
	
	Optional<OntologyIRI> getVersinIRI();
	
	Resource getContextId();
}
