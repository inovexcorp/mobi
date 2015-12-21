package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.datarange.DataRange;

public interface DataSomeValuesFrom extends ClassExpression {

	DataPropertyExpression getProperty();
	
	DataRange getDataRange();
}
