package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;

public interface SubDataPropertyOfAxiom extends DataPropertyAxiom {
	
	public DataPropertyExpression getSubDataProperty();
	
	public DataPropertyExpression getSuperDataProperty();

}
