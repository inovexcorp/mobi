package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface SymmetricObjectPropertyAxiom extends ObjectPropertyAxiom {

    ObjectPropertyExpression getObjectProperty();
}
