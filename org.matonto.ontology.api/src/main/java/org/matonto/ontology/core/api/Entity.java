package org.matonto.ontology.core.api;

import org.matonto.ontology.core.api.types.EntityType;
import org.matonto.rdf.api.IRI;


public interface Entity {

    IRI getIRI();

    EntityType getEntityType();
}
