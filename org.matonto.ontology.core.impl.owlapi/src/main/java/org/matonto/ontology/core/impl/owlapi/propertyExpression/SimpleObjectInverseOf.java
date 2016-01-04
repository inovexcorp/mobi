package org.matonto.ontology.core.impl.owlapi.propertyExpression;

import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.propertyexpression.ObjectInverseOf;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;


public class SimpleObjectInverseOf 
	extends SimpleObjectPropertyExpression
	implements ObjectInverseOf {

	
	private ObjectPropertyExpression inverseProperty;
	
	public SimpleObjectInverseOf(@Nonnull ObjectPropertyExpression inverseProperty)
	{
		this.inverseProperty = inverseProperty;
	}
	

	@Override
	public ObjectPropertyExpression getInverse() 
	{
		return inverseProperty;
	}
	
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
			return true;
		
		if (obj instanceof ObjectInverseOf) {
			ObjectInverseOf other = (ObjectInverseOf) obj;
			return other.getInverse().equals(inverseProperty);
		}
		
		return false;
	}

}
