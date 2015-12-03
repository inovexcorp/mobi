package org.matonto.ontology.core.api;


public interface DataPropertyAssertionAxiom extends AssertionAxiom {

	public Individual getSubject();
	
	public DataPropertyExpression getDataProperty();
	
	public Literal getValue();
	
}
