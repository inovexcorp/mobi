package org.matonto.ontology.core.api.axiom;


import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;

public interface SubAnnotationPropertyOfAxiom extends AnnotationAxiom {
	
	AnnotationProperty getSubProperty();
	
	AnnotationProperty getSuperProperty();
}
