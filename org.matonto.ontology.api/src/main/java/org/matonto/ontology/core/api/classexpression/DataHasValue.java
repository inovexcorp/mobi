package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.Literal;

public interface DataHasValue extends ClassExpression {

	public DataPropertyExpression getProperty();
	
	public Literal getValue();
	
}
