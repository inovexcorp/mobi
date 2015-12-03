package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.ObjectIntersectionOf;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleObjectIntersectionOf 
	extends SimpleClassExpression
	implements ObjectIntersectionOf {

	
	public SimpleObjectIntersectionOf(Set<ClassExpression> operands) 
	{
		super(operands);
	}

	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_INTERSECTION_OF;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
			return true;
		
		if (!super.equals(obj))
			return false;
				
		return (obj instanceof SimpleObjectIntersectionOf);
	}


}
