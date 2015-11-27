package org.matonto.ontology.core.api;

public interface SubDataPropertyOfAxiom extends DataPropertyAxiom {
	
	public DataPropertyExpression getSubDataProperty();
	
	public DataPropertyExpression getSuperDataProperty();

}
