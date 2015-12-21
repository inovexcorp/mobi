package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface ObjectAllValuesFrom extends ClassExpression {

	ObjectPropertyExpression getProperty();
	
	ClassExpression getClassExpression();
}
