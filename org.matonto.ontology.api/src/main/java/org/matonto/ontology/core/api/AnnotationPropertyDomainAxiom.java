package org.matonto.ontology.core.api;


public interface AnnotationPropertyDomainAxiom extends AnnotationAxiom {

	public OntologyIRI getDomain();
	
	public AnnotationProperty getProperty();
}
