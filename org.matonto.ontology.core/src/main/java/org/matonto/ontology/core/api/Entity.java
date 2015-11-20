package org.matonto.ontology.core.api;

import org.matonto.ontology.core.impl.owlapi.SimpleEntityType;

public interface Entity {

	public OntologyIRI getIRI();
	
	public SimpleEntityType getEntityType();
	
}
