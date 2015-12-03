package org.matonto.ontology.core.api.axiom;


import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;

public interface FunctionalDataPropertyAxiom extends DataPropertyAxiom {

	public DataPropertyExpression getDataProperty();
}
