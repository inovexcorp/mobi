package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface NegativeObjectPropertyAssertionAxiom extends AssertionAxiom {

    Individual getSubject();

    ObjectPropertyExpression getProperty();

    Individual getObject();

    boolean containsAnonymousIndividuals();
}
