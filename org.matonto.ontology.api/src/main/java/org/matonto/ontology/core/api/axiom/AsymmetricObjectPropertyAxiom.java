package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;


public interface AsymmetricObjectPropertyAxiom extends ObjectPropertyAxiom {

    ObjectPropertyExpression getObjectProperty();
}
