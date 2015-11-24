package org.matonto.ontology.core.api;


public interface ObjectPropertyDomainAxiom extends ObjectPropertyAxiom {
	
	public ObjectPropertyExpression getObjectProperty();
	
	public ClassExpression getDomain();

}
