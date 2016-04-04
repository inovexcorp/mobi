package org.matonto.ontology.core.api.propertyexpression;

import org.matonto.rdf.api.IRI;

public interface AnnotationProperty extends Property {

    IRI getIRI();

    boolean isComment();

    boolean isLabel();
}
