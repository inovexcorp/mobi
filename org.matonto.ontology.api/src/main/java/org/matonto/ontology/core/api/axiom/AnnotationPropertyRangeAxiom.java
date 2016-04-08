package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.rdf.api.IRI;

public interface AnnotationPropertyRangeAxiom extends AnnotationAxiom {

    IRI getRange();

    AnnotationProperty getProperty();
}
