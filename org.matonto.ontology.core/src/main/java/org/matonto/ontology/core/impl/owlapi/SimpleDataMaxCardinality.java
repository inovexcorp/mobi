package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.DataMaxCardinality;
import org.matonto.ontology.core.api.DataPropertyExpression;
import org.matonto.ontology.core.api.DataRange;

public class SimpleDataMaxCardinality 
	extends SimpleDataCardinalityRestriction 
	implements DataMaxCardinality {

	
	public SimpleDataMaxCardinality(DataPropertyExpression property, int cardinality, DataRange dataRange) 
	{
		super(property, cardinality, dataRange);
	}
	
	
	@Override
	public SimpleClassExpressionType getClassExpressionType() 
	{
		return SimpleClassExpressionType.DATA_MAX_CARDINALITY;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
			return true;
		
		if (!super.equals(obj)) 
			return false;
		
		return obj instanceof DataMaxCardinality;
	}


}
