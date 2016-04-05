package org.matonto.ontology.core.api.datarange;

import org.matonto.rdf.api.Literal;

import java.util.Set;

public interface DataOneOf extends DataRange {
    Set<Literal> getValues();
}
