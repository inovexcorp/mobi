package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.OClass;

import java.util.Set;

public interface DisjointUnionAxiom extends ClassAxiom {

	OClass getOWLClass();
	
	Set<ClassExpression> getClassExpressions();
}
