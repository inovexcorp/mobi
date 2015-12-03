package org.matonto.ontology.core.api;


import org.matonto.ontology.core.api.datarange.Datatype;

public interface Literal extends AnnotationValue {

	public String getLanguage();
	
	public String getLiteral();
	
	public Datatype getDatatype();
}
