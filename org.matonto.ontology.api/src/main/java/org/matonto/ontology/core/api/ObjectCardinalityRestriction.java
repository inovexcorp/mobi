package org.matonto.ontology.core.api;

public interface ObjectCardinalityRestriction extends ClassExpression {
	
	public ObjectPropertyExpression getProperty();
	
	public int getCardinality();
	
	public ClassExpression getClassExpression();

}
