package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.rdf.api.Literal;

public interface DataPropertyAssertionAxiom extends AssertionAxiom {

    Individual getSubject();

    DataPropertyExpression getDataProperty();

    Literal getValue();
}
