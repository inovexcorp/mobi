package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import java.util.Set;

public interface EquivalentObjectPropertiesAxiom extends ObjectPropertyAxiom {
	
	public Set<ObjectPropertyExpression> getObjectPropertys();

}
