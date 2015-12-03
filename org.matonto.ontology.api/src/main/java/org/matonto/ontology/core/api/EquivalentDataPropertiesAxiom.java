package org.matonto.ontology.core.api;

import java.util.Set;


public interface EquivalentDataPropertiesAxiom extends DataPropertyAxiom {

	public Set<DataPropertyExpression> getDataProperties();
	
}
