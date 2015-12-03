package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

public interface ObjectCardinalityRestriction extends ClassExpression {
	
	public ObjectPropertyExpression getProperty();
	
	public int getCardinality();
	
	public ClassExpression getClassExpression();

}
