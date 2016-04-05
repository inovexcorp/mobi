package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.classexpression.ClassExpression;

public interface ClassAssertionAxiom extends AssertionAxiom {

    Individual getIndividual();

    ClassExpression getClassExpression();
}
