package org.matonto.ontology.core.api;

import java.util.Set;

public interface DatatypeRestriction extends DataRange {

	public Datatype getDatatype();
	
	public Set<FacetRestriction> getFacetRestictions();
	
}
