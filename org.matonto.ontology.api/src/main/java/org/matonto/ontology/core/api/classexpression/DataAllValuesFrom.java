package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.datarange.DataRange;

public interface DataAllValuesFrom extends ClassExpression {

	public DataPropertyExpression getProperty();
	
	public DataRange getDataRange();
	
}
