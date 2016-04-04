package org.matonto.ontology.core.api;

import org.matonto.rdf.api.Value;

public interface AnonymousIndividual extends Value, AnnotationSubject, Individual {

    String getId();
}
