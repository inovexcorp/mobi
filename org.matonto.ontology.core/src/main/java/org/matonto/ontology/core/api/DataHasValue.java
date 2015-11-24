package org.matonto.ontology.core.api;

public interface DataHasValue extends ClassExpression {

	public DataPropertyExpression getProperty();
	
	public Literal getValue();
	
}
