package org.matonto.ontology.core.api.datarange;

import java.util.Set;
import org.matonto.rdf.api.Literal;


public interface DataOneOf extends DataRange {

	Set<Literal> getValues();
}
