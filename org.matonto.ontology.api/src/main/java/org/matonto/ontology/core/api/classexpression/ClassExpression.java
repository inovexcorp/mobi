package org.matonto.ontology.core.api.classexpression;

import java.util.Set;

import org.matonto.ontology.core.api.types.ClassExpressionType;

public interface ClassExpression {

	public ClassExpressionType getClassExpressionType();
	
	public Set<ClassExpression> asConjunctSet();
	
	public boolean containsConjunct(ClassExpression ce);
	
	public Set<ClassExpression> asDisjunctSet();
	
}
