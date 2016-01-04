package org.matonto.ontology.core.impl.owlapi.classexpression;

import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.ObjectMaxCardinality;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleObjectMaxCardinality 
	extends SimpleObjectCardinalityRestriction 
	implements ObjectMaxCardinality {
	
	public SimpleObjectMaxCardinality(@Nonnull ObjectPropertyExpression property, int cardinality, @Nonnull ClassExpression expression) 
	{
		super(property, cardinality, expression);
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_MAX_CARDINALITY;
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
