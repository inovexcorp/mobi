package org.matonto.ontology.core.api.axiom;


import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface InverseObjectPropertiesAxiom extends ObjectPropertyAxiom {
	
	ObjectPropertyExpression getFirstProperty();
	
	ObjectPropertyExpression getSecondProperty();
}
