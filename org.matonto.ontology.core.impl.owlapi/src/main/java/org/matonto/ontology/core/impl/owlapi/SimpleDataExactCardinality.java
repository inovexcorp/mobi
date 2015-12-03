package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;

import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.DataExactCardinality;
import org.matonto.ontology.core.api.classexpression.DataMaxCardinality;
import org.matonto.ontology.core.api.classexpression.DataMinCardinality;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleDataExactCardinality 
	extends SimpleDataCardinalityRestriction 
	implements DataExactCardinality {

	
	public SimpleDataExactCardinality(DataPropertyExpression property, int cardinality, DataRange dataRange) 
	{
		super(property, cardinality, dataRange);
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.DATA_EXACT_CARDINALITY;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
			return true;
		
		if (!super.equals(obj)) 
			return false;
		
		return obj instanceof DataExactCardinality;
	}
	
	
	@Override
	public ClassExpression asIntersectionOfMinMax() 
	{
		DataMinCardinality minCard = new SimpleDataMinCardinality(getProperty(), getCardinality(), getDataRange());
		DataMaxCardinality maxCard = new SimpleDataMaxCardinality(getProperty(), getCardinality(), getDataRange());
		Set<ClassExpression> expressionSet = new HashSet<ClassExpression>();
		expressionSet.add(minCard);
		expressionSet.add(maxCard);
		
		return new SimpleObjectIntersectionOf(expressionSet);
	}

}
