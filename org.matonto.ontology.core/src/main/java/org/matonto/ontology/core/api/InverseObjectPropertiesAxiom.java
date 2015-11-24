package org.matonto.ontology.core.api;


public interface InverseObjectPropertiesAxiom extends ObjectPropertyAxiom {
	
	public ObjectPropertyExpression getFirstProperty();
	
	public ObjectPropertyExpression getSecondProperty();

}
