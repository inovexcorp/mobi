package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.FacetRestriction;
import org.matonto.ontology.core.api.Literal;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.Facet;

public class SimpleFacetRestriction implements FacetRestriction {

	
	private Facet facet;
	private Literal facetValue;
	
	
	public SimpleFacetRestriction(Facet facet, Literal facetValue)
	{
		this.facet = Preconditions.checkNotNull(facet, "facet cannot be null");
		this.facetValue = Preconditions.checkNotNull(facetValue, "facetValues cannot be null");
	}
	
	
	@Override
	public Facet
	getFacet()
	{
		return facet;
	}

	
	@Override
	public Literal getFacetValue() 
	{
		return facetValue;
	}

	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
		    return true;
		}
		if ((obj instanceof FacetRestriction)) {
			FacetRestriction other = (FacetRestriction)obj;
			return ((getFacet().equals(other.getFacet())) && (getFacetValue().equals(other.getFacetValue())));
		}		
		return false;
	}
	
}
