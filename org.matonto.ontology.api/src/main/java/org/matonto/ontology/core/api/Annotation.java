package org.matonto.ontology.core.api;

import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;

import java.util.Set;


public interface Annotation {

	public AnnotationProperty getProperty();
	
	public AnnotationValue getValue();
	
	public Set<Annotation> getAnnotations();
	
	public boolean isAnnotated();
	
}
