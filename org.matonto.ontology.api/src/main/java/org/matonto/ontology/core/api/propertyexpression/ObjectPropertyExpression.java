package org.matonto.ontology.core.api.propertyexpression;

public interface ObjectPropertyExpression extends PropertyExpression {

	ObjectPropertyExpression getInverseProperty();
	
	ObjectPropertyExpression getSimplified();
}
