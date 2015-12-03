package org.matonto.ontology.core.api.datarange;

import org.matonto.ontology.core.api.FacetRestriction;

import java.util.Set;

public interface DatatypeRestriction extends DataRange {

	public Datatype getDatatype();
	
	public Set<FacetRestriction> getFacetRestictions();
	
}
