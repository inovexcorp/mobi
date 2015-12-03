package org.matonto.ontology.core.api.propertyexpression;

import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.propertyexpression.Property;

public interface AnnotationProperty extends Property {
	
	public OntologyIRI getIRI();

	public boolean isComment();
	  
	public boolean isLabel();
	  
}
