package org.matonto.ontology.core.api;

import com.google.common.base.Optional;


public interface AnnotationValue {

	Optional<OntologyIRI> asIRI();

	Optional<Literal> asLiteral();

	Optional<AnonymousIndividual> asAnonymousIndividual();
}
