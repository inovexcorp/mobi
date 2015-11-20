package org.matonto.ontology.core.api;

import org.matonto.ontology.core.impl.owlapi.SimpleFacet;

public interface FacetRestriction {

		public SimpleFacet getFacet();
		
		public Literal getFacetValue();
		
}
