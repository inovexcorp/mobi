package org.matonto.ontology.core.api.datarange;

import java.util.Set;


public interface DataIntersectionOf extends DataRange {

	public Set<DataRange> getOperands();
	
}
