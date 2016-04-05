package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface SubObjectPropertyOfAxiom extends ObjectPropertyAxiom {

    ObjectPropertyExpression getSubObjectProperty();

    ObjectPropertyExpression getSuperObjectProperty();
}
