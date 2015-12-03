package org.matonto.ontology.core.api.axiom;


import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.OntologyIRI;

public interface AnnotationPropertyDomainAxiom extends AnnotationAxiom {

	public OntologyIRI getDomain();
	
	public AnnotationProperty getProperty();
}
