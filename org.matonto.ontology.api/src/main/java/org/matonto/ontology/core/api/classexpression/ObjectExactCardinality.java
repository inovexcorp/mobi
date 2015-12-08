package org.matonto.ontology.core.api.classexpression;

public interface ObjectExactCardinality extends ObjectCardinalityRestriction {

	ClassExpression asIntersectionOfMinMax();
}
