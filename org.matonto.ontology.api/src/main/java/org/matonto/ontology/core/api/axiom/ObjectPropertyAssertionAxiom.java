package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface ObjectPropertyAssertionAxiom extends AssertionAxiom {

	public Individual getSubject();
	
	public ObjectPropertyExpression getProperty();
	
	public Individual getObject();
	
	public boolean containsAnonymousIndividuals();
}
