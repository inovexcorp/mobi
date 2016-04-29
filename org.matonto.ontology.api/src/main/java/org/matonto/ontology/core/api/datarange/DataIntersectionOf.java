package org.matonto.ontology.core.api.datarange;

import java.util.Set;

public interface DataIntersectionOf extends DataRange {

    Set<DataRange> getOperands();
}
