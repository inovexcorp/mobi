package org.matonto.ontology.core.api.axiom;


import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.AnnotationSubject;
import org.matonto.ontology.core.api.AnnotationValue;

public interface AnnotationAssertionAxiom extends AnnotationAxiom {

	AnnotationSubject getSubject();
	
	AnnotationProperty getProperty();
	
	AnnotationValue getValue();
	
	Annotation getAnnotation();
}
