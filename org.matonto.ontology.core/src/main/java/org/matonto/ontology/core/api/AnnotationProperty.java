package org.matonto.ontology.core.api;

public interface AnnotationProperty extends Property {
	
	public OntologyIRI getIRI();

	public boolean isComment();
	  
	public boolean isLabel();
	  
}
