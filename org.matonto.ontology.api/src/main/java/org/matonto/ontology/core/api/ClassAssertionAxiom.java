package org.matonto.ontology.core.api;


public interface ClassAssertionAxiom extends AssertionAxiom {

	public Individual getIndividual();
	
	public ClassExpression getClassExpression();
	
}
