package org.matonto.ontology.core.api.axiom;


import org.matonto.ontology.core.api.classexpression.ClassExpression;

public interface SubClassOfAxiom extends ClassAxiom {

	public ClassExpression getSubClass();
	
	public ClassExpression getSuperClass();
	
}
