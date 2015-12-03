package org.matonto.ontology.core.api.propertyexpression;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface ObjectInverseOf extends ObjectPropertyExpression {

	
	public ObjectPropertyExpression getInverse();
}
