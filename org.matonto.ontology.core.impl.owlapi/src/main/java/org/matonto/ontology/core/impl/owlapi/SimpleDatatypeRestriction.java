package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;

import org.matonto.ontology.core.api.Datatype;
import org.matonto.ontology.core.api.DatatypeRestriction;
import org.matonto.ontology.core.api.FacetRestriction;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.DataRangeType;

public class SimpleDatatypeRestriction implements DatatypeRestriction {

	
	private Datatype datatype;
	private Set<FacetRestriction> facetRestrictions;
	
	
	public SimpleDatatypeRestriction(Datatype datatype, Set<FacetRestriction> facetRestrictions)
	{
		this.datatype = Preconditions.checkNotNull(datatype, "datatype cannot be null");
		this.facetRestrictions = new HashSet<FacetRestriction>(Preconditions.checkNotNull(facetRestrictions, "facetRestrictions cannot be null"));
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
