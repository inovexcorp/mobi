package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;

public interface DataCardinalityRestriction extends ClassExpression {

	
	public DataPropertyExpression getProperty();
	
	public int getCardinality();
	
	public DataRange getDataRange();

}
