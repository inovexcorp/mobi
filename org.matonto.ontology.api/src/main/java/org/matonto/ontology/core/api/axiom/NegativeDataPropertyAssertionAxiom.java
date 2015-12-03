package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.Literal;

public interface NegativeDataPropertyAssertionAxiom extends AssertionAxiom {

	public Individual getSubject();
	
	public DataPropertyExpression getDataProperty();
	
	public Literal getValue();
	
}
