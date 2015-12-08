package org.matonto.ontology.core.api;

import com.google.common.base.Optional;

public interface OntologyIRI extends AnnotationValue, AnnotationSubject {

	String getNamespace();
	
	Optional<String> getLocalName();
}
