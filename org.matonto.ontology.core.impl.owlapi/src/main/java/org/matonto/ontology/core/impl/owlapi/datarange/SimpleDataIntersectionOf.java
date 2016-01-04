package org.matonto.ontology.core.impl.owlapi.datarange;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.datarange.DataIntersectionOf;
import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.types.DataRangeType;


public class SimpleDataIntersectionOf implements DataIntersectionOf {

	
	private Set<DataRange> operands;
	
	public SimpleDataIntersectionOf(@Nonnull Set<DataRange> operands)
	{
		this.operands = new TreeSet<DataRange>(operands);
	}
	
	
	@Override
	public boolean isDatatype() 
	{
		return false;
	}

	
	@Override
	public Set<DataRange> getOperands() 
	{
		return new HashSet<DataRange>(operands);
	}
	
	
	@Override
	public DataRangeType getDataRangeType()
	{
		return DataRangeType.DATA_INTERSECTION_OF;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
		    return true;
		}
		if ((obj instanceof DataIntersectionOf)) {
			DataIntersectionOf other = (DataIntersectionOf)obj;
			return getOperands().equals(other.getOperands());
		}
		
		return false;
	}

}
