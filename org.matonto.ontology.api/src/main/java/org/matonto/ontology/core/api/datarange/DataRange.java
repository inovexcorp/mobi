package org.matonto.ontology.core.api.datarange;

import org.matonto.ontology.core.api.types.DataRangeType;

public interface DataRange {

	boolean isDatatype();
	
	DataRangeType getDataRangeType();
}
