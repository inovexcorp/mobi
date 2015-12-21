package org.matonto.ontology.core.api;

import java.util.Optional;

public interface AnnotationValue {

	// TODO: This smells bad
	Optional<OntologyIRI> asIRI();

	Optional<Literal> asLiteral();

	Optional<AnonymousIndividual> asAnonymousIndividual();
}
