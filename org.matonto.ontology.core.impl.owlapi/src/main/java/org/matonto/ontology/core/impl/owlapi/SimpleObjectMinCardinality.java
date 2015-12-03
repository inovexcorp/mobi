package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.ObjectMinCardinality;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleObjectMinCardinality 
	extends SimpleObjectCardinalityRestriction 
	implements ObjectMinCardinality {

	
	
	public SimpleObjectMinCardinality(ObjectPropertyExpression property, int cardinality, ClassExpression expression) 
	{
		super(property, cardinality, expression);
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_MIN_CARDINALITY;
	}
	
	
	public boolean equals(Object obj)
	{
		if (this == obj) 
			return true;
		
		if (!super.equals(obj)) 
			return false;
		
		return obj instanceof ObjectMinCardinality;
	}
	

}
