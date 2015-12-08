package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.classexpression.ClassExpression;

import java.util.Set;

public interface DisjointClassesAxiom extends ClassAxiom {

	Set<ClassExpression> getClassExpressions();
}
