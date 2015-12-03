package org.matonto.ontology.core.api;

import java.util.Set;

public interface DisjointUnionAxiom extends ClassAxiom {

	public OClass getOWLClass();
	
	public Set<ClassExpression> getClassExpressions();
	
}
