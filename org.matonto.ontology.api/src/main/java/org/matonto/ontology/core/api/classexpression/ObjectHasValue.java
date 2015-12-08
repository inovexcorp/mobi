package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface ObjectHasValue extends ClassExpression {
	
	ObjectPropertyExpression getProperty();
}
