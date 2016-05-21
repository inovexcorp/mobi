package org.matonto.ontology.core.api;

import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.rdf.api.Value;

import java.util.Set;


public interface Annotation extends OWLObject {

    AnnotationProperty getProperty();

    Value getValue();

    Set<Annotation> getAnnotations();

    boolean isAnnotated();
}
