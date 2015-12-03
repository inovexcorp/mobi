package org.matonto.ontology.core.api;

import com.google.common.base.Optional;


public interface AnnotationValue {

		public Optional<OntologyIRI> asIRI();
		
		public Optional<Literal> asLiteral();
		
		public Optional<AnonymousIndividual> asAnonymousIndividual();
}
