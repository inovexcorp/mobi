package org.matonto.ontology.core.api;


public interface DataPropertyRangeAxiom extends DataPropertyAxiom {
	
	public DataPropertyExpression getDataProperty();
	
	public DataRange getRange();
}
