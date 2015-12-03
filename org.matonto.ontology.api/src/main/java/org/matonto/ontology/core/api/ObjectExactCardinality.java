package org.matonto.ontology.core.api;

public interface ObjectExactCardinality extends ObjectCardinalityRestriction {

	
	public abstract ClassExpression asIntersectionOfMinMax();
}
