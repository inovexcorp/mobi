package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.AnnotationSubject;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.rdf.api.Value;


public interface AnnotationAssertionAxiom extends AnnotationAxiom {

    AnnotationSubject getSubject();

    AnnotationProperty getProperty();

    Value getValue();

    Annotation getAnnotation();
}
