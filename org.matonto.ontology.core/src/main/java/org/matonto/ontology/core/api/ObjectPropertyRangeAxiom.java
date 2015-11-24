package org.matonto.ontology.core.api;

public interface ObjectPropertyRangeAxiom extends ObjectPropertyAxiom {
	
	public ObjectPropertyExpression getObjectProperty();
	
	public ClassExpression getRange();

}
