package org.matonto.ontology.core.api.axiom;


import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.datarange.DataRange;

public interface DataPropertyRangeAxiom extends DataPropertyAxiom {
	
	public DataPropertyExpression getDataProperty();
	
	public DataRange getRange();
}
