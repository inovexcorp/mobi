package org.matonto.ontology.core.api;

import org.matonto.ontology.core.api.types.Facet;
import org.matonto.rdf.api.Literal;


public interface FacetRestriction {

    Facet getFacet();

    Literal getFacetValue();
}
