package org.matonto.ontology.core.api.classexpression;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public interface ClassExpression {

	ClassExpressionType getClassExpressionType();
	
	Set<ClassExpression> asConjunctSet();
	
	boolean containsConjunct(@Nonnull ClassExpression ce);
	
	Set<ClassExpression> asDisjunctSet();
}
