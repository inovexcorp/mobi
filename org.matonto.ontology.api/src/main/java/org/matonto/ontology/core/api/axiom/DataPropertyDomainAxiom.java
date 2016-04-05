package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;

public interface DataPropertyDomainAxiom extends DataPropertyAxiom {

    DataPropertyExpression getDataProperty();

    ClassExpression getDomain();
}
