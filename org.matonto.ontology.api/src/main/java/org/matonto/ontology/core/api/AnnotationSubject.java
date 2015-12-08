package org.matonto.ontology.core.api;

import com.google.common.base.Optional;

public interface AnnotationSubject {

	Optional<OntologyIRI> asIRI();
	
	Optional<AnonymousIndividual> asAnonymousIndividual();
}
