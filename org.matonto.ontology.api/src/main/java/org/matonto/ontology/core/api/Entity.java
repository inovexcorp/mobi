package org.matonto.ontology.core.api;


import org.matonto.ontology.core.api.types.EntityType;

public interface Entity {

	public OntologyIRI getIRI();
	
	public EntityType getEntityType();
	
}
