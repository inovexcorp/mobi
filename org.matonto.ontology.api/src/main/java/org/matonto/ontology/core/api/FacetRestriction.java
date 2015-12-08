package org.matonto.ontology.core.api;

import org.matonto.ontology.core.api.types.Facet;

public interface FacetRestriction {

	Facet getFacet();
		
	Literal getFacetValue();
}
