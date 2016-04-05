package org.matonto.ontology.core.api;

import org.matonto.rdf.api.IRI;

import java.util.Optional;


public interface AnnotationSubject {

    Optional<IRI> asIRI();

    Optional<AnonymousIndividual> asAnonymousIndividual();
}
