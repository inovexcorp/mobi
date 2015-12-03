package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface SubObjectPropertyOfAxiom extends ObjectPropertyAxiom {
		
	public ObjectPropertyExpression getSubObjectProperty();
	
	public ObjectPropertyExpression getSuperObjectProperty();

}
