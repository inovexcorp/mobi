package org.matonto.ontology.core.api.axiom;


import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.datarange.Datatype;

public interface DatatypeDefinitionAxiom extends Axiom {

	Datatype getDatatype();
	
	DataRange getDataRange();
}

