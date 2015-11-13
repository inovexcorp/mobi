package org.matonto.ontology.core.api;

import java.util.Set;


public interface Annotation {

	public AnnotationProperty getProperty();
	
	public AnnotationValue getValue();
	
	public abstract Set<Annotation> getAnnotations();
	
}
