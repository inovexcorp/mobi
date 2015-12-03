package org.matonto.ontology.core.api;


public interface Literal extends AnnotationValue {

	public String getLanguage();
	
	public String getLiteral();
	
	public Datatype getDatatype();
}
