package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.ObjectUnionOf;

public class SimpleObjectUnionOf 
	extends SimpleClassExpression 
		implements ObjectUnionOf {

	public SimpleObjectUnionOf(Set<ClassExpression> operands) 
	{
		super(operands);
	}
	
	
	@Override
	public SimpleClassExpressionType getClassExpressionType()
	{
		return SimpleClassExpressionType.OBJECT_UNION_OF;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		
		return (obj instanceof SimpleObjectUnionOf);
	}
	

}
