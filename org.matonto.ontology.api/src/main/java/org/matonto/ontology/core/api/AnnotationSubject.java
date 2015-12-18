package org.matonto.ontology.core.api;

import java.util.Optional;

public interface AnnotationSubject {

	Optional<OntologyIRI> asIRI();
	
	Optional<AnonymousIndividual> asAnonymousIndividual();
}
