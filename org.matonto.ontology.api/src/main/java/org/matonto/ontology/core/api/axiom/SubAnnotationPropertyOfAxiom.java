package org.matonto.ontology.core.api.axiom;


import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;

public interface SubAnnotationPropertyOfAxiom extends AnnotationAxiom {
	
	public AnnotationProperty getSubProperty();
	
	public AnnotationProperty getSuperProperty();
}
