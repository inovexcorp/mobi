package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.ObjectMinCardinality;
import org.matonto.ontology.core.api.ObjectPropertyExpression;


public class SimpleObjectMinCardinality 
	extends SimpleObjectCardinalityRestriction 
	implements ObjectMinCardinality {

	
	
	public SimpleObjectMinCardinality(ObjectPropertyExpression property, int cardinality, ClassExpression expression) 
	{
		super(property, cardinality, expression);
	}
	
	
	@Override
	public SimpleClassExpressionType getClassExpressionType() 
	{
		return SimpleClassExpressionType.OBJECT_MIN_CARDINALITY;
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
