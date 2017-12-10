package com.mobi.meaning.extraction.expression.context;

import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.rdf.api.IRI;

public interface IriExpressionContext {

    ExtractedOntology getOntology();

    IRI getOntologyIri();

    String uuid();

}
