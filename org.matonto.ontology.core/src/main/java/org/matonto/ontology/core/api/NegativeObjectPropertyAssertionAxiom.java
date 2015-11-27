package org.matonto.ontology.core.api;

public interface NegativeObjectPropertyAssertionAxiom extends AssertionAxiom {

	public Individual getSubject();
	
	public ObjectPropertyExpression getProperty();
	
	public Individual getObject();
	
	public boolean containsAnonymousIndividuals();
}
