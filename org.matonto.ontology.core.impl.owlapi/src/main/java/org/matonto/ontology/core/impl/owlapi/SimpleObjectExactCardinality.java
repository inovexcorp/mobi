package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;

import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.ObjectExactCardinality;
import org.matonto.ontology.core.api.ObjectMaxCardinality;
import org.matonto.ontology.core.api.ObjectMinCardinality;
import org.matonto.ontology.core.api.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.ClassExpressionType;

public class SimpleObjectExactCardinality 
	extends SimpleObjectCardinalityRestriction 
	implements ObjectExactCardinality {

	
	
	public SimpleObjectExactCardinality(ObjectPropertyExpression property, int cardinality, ClassExpression expression) 
	{
		super(property, cardinality, expression);
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_EXACT_CARDINALITY;
	}
	
	
	public boolean equals(Object obj)
	{
		if (this == obj)
			return true;
		
		if (!super.equals(obj))
			return false;
		
		return obj instanceof ObjectExactCardinality;
	}

	
	@Override
	public ClassExpression asIntersectionOfMinMax() 
	{
		ObjectMinCardinality minCard = new SimpleObjectMinCardinality(getProperty(), getCardinality(), getClassExpression());
		ObjectMaxCardinality maxCard = new SimpleObjectMaxCardinality(getProperty(), getCardinality(), getClassExpression());
		Set<ClassExpression> expressionSet = new HashSet<ClassExpression>();
		expressionSet.add(minCard);
		expressionSet.add(maxCard);
		
		return new SimpleObjectIntersectionOf(expressionSet);
	}

}
