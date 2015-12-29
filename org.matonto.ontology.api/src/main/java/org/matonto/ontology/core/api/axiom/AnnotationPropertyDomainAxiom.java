package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.rdf.api.IRI;


public interface AnnotationPropertyDomainAxiom extends AnnotationAxiom {

	IRI getDomain();
	
	AnnotationProperty getProperty();
}
