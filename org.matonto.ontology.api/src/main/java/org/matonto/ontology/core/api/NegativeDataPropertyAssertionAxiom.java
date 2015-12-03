package org.matonto.ontology.core.api;

public interface NegativeDataPropertyAssertionAxiom extends AssertionAxiom {

	public Individual getSubject();
	
	public DataPropertyExpression getDataProperty();
	
	public Literal getValue();
	
}
