package org.matonto.ontology.core.impl.owlapi.datarange;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.datarange.DataOneOf;
import org.matonto.ontology.core.api.Literal;
import org.matonto.ontology.core.api.types.DataRangeType;


public class SimpleDataOneOf implements DataOneOf {	
	
	private Set<Literal> values;
	
	public SimpleDataOneOf(@Nonnull Set<Literal> values)	
	{
		this.values = new HashSet<Literal>(values);
	}
	
	
	@Override
	public boolean isDatatype() 
	{
		return false;
	}

	
	@Override
	public DataRangeType getDataRangeType()
	{
		return DataRangeType.DATA_ONE_OF;
	}

	
	@Override
	public Set<Literal> getValues() 
	{
		return new HashSet<Literal>(values);
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if ((obj instanceof DataOneOf)) {
			DataOneOf other = (DataOneOf)obj;
			return getValues().equals(other.getValues());
		}
		
		return false;
	}

}
