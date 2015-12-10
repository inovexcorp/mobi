package org.matonto.ontology.core.api;


import org.matonto.ontology.core.api.types.EntityType;

public interface Entity {

	OntologyIRI getIRI();
	
	EntityType getEntityType();
}
