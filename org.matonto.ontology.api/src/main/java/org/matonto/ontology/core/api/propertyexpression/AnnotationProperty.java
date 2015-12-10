package org.matonto.ontology.core.api.propertyexpression;

import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.propertyexpression.Property;

public interface AnnotationProperty extends Property {
	
	OntologyIRI getIRI();

	boolean isComment();
	  
	boolean isLabel();
}
