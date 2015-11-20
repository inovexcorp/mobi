package org.matonto.ontology.core.api;

import org.matonto.ontology.core.impl.owlapi.SimpleDataRangeType;

public interface DataRange {

	public boolean isDatatype();
	
	public SimpleDataRangeType getDataRangeType();
	
}
