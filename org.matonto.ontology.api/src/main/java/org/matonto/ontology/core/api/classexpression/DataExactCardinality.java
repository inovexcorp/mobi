package org.matonto.ontology.core.api.classexpression;

public interface DataExactCardinality extends DataCardinalityRestriction {
	
	public abstract ClassExpression asIntersectionOfMinMax();

}
