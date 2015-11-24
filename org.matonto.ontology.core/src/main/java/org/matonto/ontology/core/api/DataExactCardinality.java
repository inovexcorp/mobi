package org.matonto.ontology.core.api;

public interface DataExactCardinality extends DataCardinalityRestriction {
	
	public abstract ClassExpression asIntersectionOfMinMax();

}
