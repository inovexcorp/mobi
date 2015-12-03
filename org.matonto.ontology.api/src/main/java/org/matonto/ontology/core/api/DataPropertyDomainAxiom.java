package org.matonto.ontology.core.api;

public interface DataPropertyDomainAxiom extends DataPropertyAxiom {
	
	public DataPropertyExpression getDataProperty();
	
	public ClassExpression getDomain();

}
