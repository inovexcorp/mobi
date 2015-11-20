package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.ObjectIntersectionOf;


public class SimpleObjectIntersectionOf 
	extends SimpleClassExpression
	implements ObjectIntersectionOf {

	
	public SimpleObjectIntersectionOf(Set<ClassExpression> operands) 
	{
		super(operands);
	}

	@Override
	public SimpleClassExpressionType getClassExpressionType() 
	{
		return SimpleClassExpressionType.OBJECT_INTERSECTION_OF;
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
