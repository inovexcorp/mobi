package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface ObjectCardinalityRestriction extends ClassExpression {

    ObjectPropertyExpression getProperty();

    int getCardinality();

    ClassExpression getClassExpression();
}
