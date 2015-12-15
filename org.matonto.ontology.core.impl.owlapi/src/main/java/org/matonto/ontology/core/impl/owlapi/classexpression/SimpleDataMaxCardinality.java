package org.matonto.ontology.core.impl.owlapi.classexpression;

import org.matonto.ontology.core.api.classexpression.DataMaxCardinality;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.types.ClassExpressionType;

public class SimpleDataMaxCardinality 
	extends SimpleDataCardinalityRestriction 
	implements DataMaxCardinality {

	
	public SimpleDataMaxCardinality(DataPropertyExpression property, int cardinality, DataRange dataRange) 
	{
		super(property, cardinality, dataRange);
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.DATA_MAX_CARDINALITY;
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
