package org.matonto.ontology.core.impl.owlapi.propertyExpression;

import org.matonto.ontology.core.api.propertyexpression.PropertyExpression;


public class SimplePropertyExpression implements PropertyExpression {

	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
			return true;

		return (obj instanceof PropertyExpression);	
	}
}
