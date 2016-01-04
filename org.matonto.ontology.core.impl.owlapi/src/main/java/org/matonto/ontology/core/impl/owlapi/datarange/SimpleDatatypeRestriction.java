package org.matonto.ontology.core.impl.owlapi.datarange;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.datarange.Datatype;
import org.matonto.ontology.core.api.datarange.DatatypeRestriction;
import org.matonto.ontology.core.api.FacetRestriction;
import org.matonto.ontology.core.api.types.DataRangeType;


public class SimpleDatatypeRestriction implements DatatypeRestriction {
	
	private Datatype datatype;
	private Set<FacetRestriction> facetRestrictions;
	
	public SimpleDatatypeRestriction(@Nonnull Datatype datatype, @Nonnull Set<FacetRestriction> facetRestrictions)
	{
		this.datatype = datatype;
		this.facetRestrictions = new HashSet<FacetRestriction>(facetRestrictions);
	}
	
	
	@Override
	public boolean isDatatype() 
	{
		return false;
	}

	
	@Override
	public DataRangeType getDataRangeType()
	{
		return DataRangeType.DATATYPE_RESTRICTION;
	}

	
	@Override
	public Datatype getDatatype() 
	{
		return datatype;
	}

	
	@Override
	public Set<FacetRestriction> getFacetRestictions() 
	{
		return new HashSet<FacetRestriction>(facetRestrictions);
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if ((obj instanceof DatatypeRestriction)) {
			DatatypeRestriction other = (DatatypeRestriction)obj;
			return ((getDatatype().equals(other.getDatatype())) && (getFacetRestictions().equals(other.getFacetRestictions())));
		}		
		return false;
	}

}
