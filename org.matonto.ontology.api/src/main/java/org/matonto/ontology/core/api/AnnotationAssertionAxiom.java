package org.matonto.ontology.core.api;


public interface AnnotationAssertionAxiom extends AnnotationAxiom {

	public AnnotationSubject getSubject();
	
	public AnnotationProperty getProperty();
	
	public AnnotationValue getValue();
	
	public Annotation getAnnotation();
	
}
