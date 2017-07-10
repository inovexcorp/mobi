package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.propertyexpression.PropertyExpression;

public interface CardinalityRestriction extends ClassExpression {

    PropertyExpression getProperty();

    int getCardinality();
}
