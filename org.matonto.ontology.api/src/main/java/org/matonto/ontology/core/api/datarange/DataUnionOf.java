package org.matonto.ontology.core.api.datarange;

import java.util.Set;

public interface DataUnionOf extends DataRange {

    Set<DataRange> getOperands();
}
