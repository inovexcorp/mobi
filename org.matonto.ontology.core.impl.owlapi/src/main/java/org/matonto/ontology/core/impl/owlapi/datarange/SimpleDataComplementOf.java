package org.matonto.ontology.core.impl.owlapi.datarange;

import org.matonto.ontology.core.api.datarange.DataComplementOf;
import org.matonto.ontology.core.api.datarange.DataRange;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.DataRangeType;

public class SimpleDataComplementOf implements DataComplementOf {

	
	private DataRange dataRange;
	
	
	public SimpleDataComplementOf(DataRange dataRange)
	{
		this.dataRange = Preconditions.checkNotNull(dataRange, "dataRange cannot be null");
	}
	
	
	@Override
	public boolean isDatatype() 
	{
		return false;
	}

	
	@Override
	public DataRangeType getDataRangeType()
	{
		return DataRangeType.DATA_COMPLEMENT_OF;
	}

	
	@Override
	public DataRange getDataRange() 
	{
		return dataRange;
	}

	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if ((obj instanceof DataComplementOf)) {
			DataComplementOf other = (DataComplementOf)obj;
			return getDataRange().equals(other.getDataRange());
		}
		
		return false;
	}

}
