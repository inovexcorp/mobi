package org.matonto.ontology.core.api;


import org.matonto.ontology.core.api.datarange.Datatype;

public interface Literal extends AnnotationValue {

	String getLanguage();
	
	String getLiteral();
	
	Datatype getDatatype();
}
