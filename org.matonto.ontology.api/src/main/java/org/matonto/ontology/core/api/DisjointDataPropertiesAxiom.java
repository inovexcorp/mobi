package org.matonto.ontology.core.api;

import java.util.Set;

public interface DisjointDataPropertiesAxiom extends DataPropertyAxiom {
	
	public Set<DataPropertyExpression> getDataProperties();

}
