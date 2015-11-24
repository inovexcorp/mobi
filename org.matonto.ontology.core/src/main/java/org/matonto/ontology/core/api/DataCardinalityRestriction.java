package org.matonto.ontology.core.api;

public interface DataCardinalityRestriction extends ClassExpression {

	
	public DataPropertyExpression getProperty();
	
	public int getCardinality();
	
	public DataRange getDataRange();

}
