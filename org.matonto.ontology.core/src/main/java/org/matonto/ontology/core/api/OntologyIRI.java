package org.matonto.ontology.core.api;

import com.google.common.base.Optional;

public interface OntologyIRI {

	public String getNamespace();
	
	public Optional<String> getLocalName();
	
}
