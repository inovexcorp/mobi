package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.ObjectMaxCardinality;
import org.matonto.ontology.core.api.ObjectPropertyExpression;

public class SimpleObjectMaxCardinality 
	extends SimpleObjectCardinalityRestriction 
	implements ObjectMaxCardinality {

	
	
	public SimpleObjectMaxCardinality(ObjectPropertyExpression property, int cardinality, ClassExpression expression) 
	{
		super(property, cardinality, expression);
	}
	
	
	@Override
	public SimpleClassExpressionType getClassExpressionType() 
	{
		return SimpleClassExpressionType.OBJECT_MAX_CARDINALITY;
	}
	
	
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		return obj instanceof ObjectMaxCardinality;
	}
	


}
