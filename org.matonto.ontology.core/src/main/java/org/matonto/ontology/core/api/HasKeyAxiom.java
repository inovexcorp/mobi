package org.matonto.ontology.core.api;

import java.util.Set;


public interface HasKeyAxiom extends Axiom {

	public ClassExpression getClassExpression();
	
	public Set<PropertyExpression> getPropertyExpressions();
	
	public Set<ObjectPropertyExpression> getObjectPropertyExpressions();
	
	public Set<DataPropertyExpression> getDataPropertyExpressions();
	
}
