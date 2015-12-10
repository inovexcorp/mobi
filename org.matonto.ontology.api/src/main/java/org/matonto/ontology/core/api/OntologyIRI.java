package org.matonto.ontology.core.api;

import java.util.Optional;

public interface OntologyIRI extends AnnotationValue, AnnotationSubject {

	String getNamespace();
	
	Optional<String> getLocalName();
	
}
