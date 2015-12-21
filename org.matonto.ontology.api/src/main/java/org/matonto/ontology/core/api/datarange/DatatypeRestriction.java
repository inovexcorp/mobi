package org.matonto.ontology.core.api.datarange;

import org.matonto.ontology.core.api.FacetRestriction;

import java.util.Set;

public interface DatatypeRestriction extends DataRange {

	Datatype getDatatype();
	
	Set<FacetRestriction> getFacetRestictions();
}
