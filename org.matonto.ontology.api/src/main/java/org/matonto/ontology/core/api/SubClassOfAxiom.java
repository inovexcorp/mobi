package org.matonto.ontology.core.api;


public interface SubClassOfAxiom extends ClassAxiom {

	public ClassExpression getSubClass();
	
	public ClassExpression getSuperClass();
	
}
