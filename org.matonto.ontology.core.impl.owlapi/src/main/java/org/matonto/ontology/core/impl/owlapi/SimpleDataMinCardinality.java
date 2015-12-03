package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.DataMinCardinality;
import org.matonto.ontology.core.api.DataPropertyExpression;
import org.matonto.ontology.core.api.DataRange;
import org.matonto.ontology.core.api.types.ClassExpressionType;

public class SimpleDataMinCardinality 
	extends SimpleDataCardinalityRestriction 
	implements DataMinCardinality {

	
	public SimpleDataMinCardinality(DataPropertyExpression property, int cardinality, DataRange dataRange) 
	{
		super(property, cardinality, dataRange);
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.DATA_MIN_CARDINALITY;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
			return true;
		
		if (!super.equals(obj)) 
			return false;
		
		return obj instanceof DataMinCardinality;
	}

}
