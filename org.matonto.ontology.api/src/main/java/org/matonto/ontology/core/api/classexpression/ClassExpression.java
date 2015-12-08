package org.matonto.ontology.core.api.classexpression;

import java.util.Set;

import org.matonto.ontology.core.api.types.ClassExpressionType;

public interface ClassExpression {

	ClassExpressionType getClassExpressionType();
	
	Set<ClassExpression> asConjunctSet();
	
	boolean containsConjunct(ClassExpression ce);
	
	Set<ClassExpression> asDisjunctSet();
}
