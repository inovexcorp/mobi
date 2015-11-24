package org.matonto.ontology.core.api;

import java.util.Set;

public interface DisjointClassesAxiom extends ClassAxiom {

	public Set<ClassExpression> getClassExpressions();
}
