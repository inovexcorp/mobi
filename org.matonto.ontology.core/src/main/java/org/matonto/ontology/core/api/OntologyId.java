package org.matonto.ontology.core.api;

import org.openrdf.model.Resource;

import com.google.common.base.Optional;


public interface OntologyId {

	public Optional<OntologyIRI> getOntologyIRI();
	
	public Optional<OntologyIRI> getVersinIRI();
	
	public Resource getContextId();
	
}
