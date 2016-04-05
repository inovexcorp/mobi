package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;

public interface DataPropertyRangeAxiom extends DataPropertyAxiom {

    DataPropertyExpression getDataProperty();

    DataRange getRange();
}
