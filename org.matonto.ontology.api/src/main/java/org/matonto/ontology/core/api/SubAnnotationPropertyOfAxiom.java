package org.matonto.ontology.core.api;


public interface SubAnnotationPropertyOfAxiom extends AnnotationAxiom {
	
	public AnnotationProperty getSubProperty();
	
	public AnnotationProperty getSuperProperty();
}
