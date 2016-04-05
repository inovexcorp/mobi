package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;

import java.util.Set;


public interface EquivalentDataPropertiesAxiom extends DataPropertyAxiom {

    Set<DataPropertyExpression> getDataProperties();
}
