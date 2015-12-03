package org.matonto.ontology.core.api.datarange;

import java.util.Set;

public interface DataUnionOf extends DataRange {

	public Set<DataRange> getOperands();
}
