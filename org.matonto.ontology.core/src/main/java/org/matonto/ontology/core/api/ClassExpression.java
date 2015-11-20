package org.matonto.ontology.core.api;

import java.util.Set;
import org.matonto.ontology.core.impl.owlapi.SimpleClassExpressionType;



public interface ClassExpression {

	public SimpleClassExpressionType getClassExpressionType();
	
	public Set<ClassExpression> asConjunctSet();
	
	public boolean containsConjunct(ClassExpression ce);
	
	public Set<ClassExpression> asDisjunctSet();
	
}
