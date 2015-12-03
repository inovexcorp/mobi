package org.matonto.ontology.core.api;

import com.google.common.base.Optional;

public interface AnnotationSubject {

	public Optional<OntologyIRI> asIRI();
	
	public Optional<AnonymousIndividual> asAnonymousIndividual();
}
