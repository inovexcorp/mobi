package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface ObjectHasSelf extends ClassExpression {

	ObjectPropertyExpression getProperty();
}
