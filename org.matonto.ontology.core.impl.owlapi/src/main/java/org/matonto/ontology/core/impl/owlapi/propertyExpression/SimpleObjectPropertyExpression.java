package org.matonto.ontology.core.impl.owlapi.propertyExpression;

import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;


public class SimpleObjectPropertyExpression 
	extends SimplePropertyExpression
	implements ObjectPropertyExpression {


	public ObjectPropertyExpression inverse;
	
	
	@Override
	public ObjectPropertyExpression getInverseProperty() 
	{
		if(inverse == null)
			return new SimpleObjectInverseOf(this);
		return inverse;
	}

	@Override
	public ObjectPropertyExpression getNamedProperty() 
	{
		return inverse;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
			return true;
		
		if(!super.equals(obj))
			return false;
		
		return obj instanceof ObjectPropertyExpression;	
	}

}
