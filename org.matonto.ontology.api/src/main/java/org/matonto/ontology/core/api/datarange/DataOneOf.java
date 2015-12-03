package org.matonto.ontology.core.api.datarange;

import org.matonto.ontology.core.api.Literal;

import java.util.Set;

public interface DataOneOf extends DataRange {

	public Set<Literal> getValues();
	
}
