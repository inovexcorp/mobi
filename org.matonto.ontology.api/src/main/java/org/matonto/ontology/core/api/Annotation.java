package org.matonto.ontology.core.api;

import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;

import java.util.Set;


public interface Annotation extends OWLObject {

	AnnotationProperty getProperty();
	
	AnnotationValue getValue();
	
	Set<Annotation> getAnnotations();
	
	boolean isAnnotated();
}
