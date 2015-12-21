package org.matonto.ontology.core.api.classexpression;

public interface DataExactCardinality extends DataCardinalityRestriction {
	
	ClassExpression asIntersectionOfMinMax();
}
