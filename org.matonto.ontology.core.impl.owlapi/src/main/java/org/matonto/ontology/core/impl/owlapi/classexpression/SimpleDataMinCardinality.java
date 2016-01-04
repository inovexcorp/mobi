package org.matonto.ontology.core.impl.owlapi.classexpression;

import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.classexpression.DataMinCardinality;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleDataMinCardinality 
	extends SimpleDataCardinalityRestriction 
	implements DataMinCardinality {

	public SimpleDataMinCardinality(@Nonnull DataPropertyExpression property, int cardinality, @Nonnull DataRange dataRange) 
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
