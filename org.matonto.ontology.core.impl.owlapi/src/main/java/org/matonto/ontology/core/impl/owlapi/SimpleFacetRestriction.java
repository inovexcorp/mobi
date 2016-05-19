package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.FacetRestriction;
import org.matonto.ontology.core.api.types.Facet;
import org.matonto.rdf.api.Literal;

import javax.annotation.Nonnull;


public class SimpleFacetRestriction implements FacetRestriction {


    private Facet facet;
    private Literal facetValue;


    public SimpleFacetRestriction(@Nonnull Facet facet, @Nonnull Literal facetValue) {
        this.facet = facet;
        this.facetValue = facetValue;
    }


    @Override
    public Facet getFacet() {
        return facet;
    }


    @Override
    public Literal getFacetValue() {
        return facetValue;
    }


    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if ((obj instanceof FacetRestriction)) {
            FacetRestriction other = (FacetRestriction) obj;
            return ((getFacet().equals(other.getFacet())) && (getFacetValue().equals(other.getFacetValue())));
        }
        return false;
    }

}
