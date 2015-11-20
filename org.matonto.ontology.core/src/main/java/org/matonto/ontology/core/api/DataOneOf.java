package org.matonto.ontology.core.api;

import java.util.Set;

public interface DataOneOf extends DataRange {

	public Set<Literal> getValues();
	
}
