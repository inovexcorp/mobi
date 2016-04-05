package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.types.ClassExpressionType;

import java.util.Set;
import javax.annotation.Nonnull;

public interface ClassExpression {

    ClassExpressionType getClassExpressionType();

    Set<ClassExpression> asConjunctSet();

    boolean containsConjunct(@Nonnull ClassExpression ce);

    Set<ClassExpression> asDisjunctSet();
}
