package org.matonto.ontology.core.api.classexpression;

import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;

public interface DataAllValuesFrom extends ClassExpression {

    DataPropertyExpression getProperty();

    DataRange getDataRange();
}
