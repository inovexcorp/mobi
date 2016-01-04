package org.matonto.ontology.core.api;

import java.util.Optional;
import org.matonto.rdf.api.IRI;


public interface AnnotationSubject {

	Optional<IRI> asIRI();
	
	Optional<AnonymousIndividual> asAnonymousIndividual();
}
