package com.mobi.meaning.extraction.expression.context;

import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.rdf.api.IRI;

import java.util.UUID;

public class AbstractIriExpressionContext implements IriExpressionContext {

    protected final ExtractedOntology ontology;

    public AbstractIriExpressionContext(ExtractedOntology ontology) {
        this.ontology = ontology;
    }

    @Override
    public ExtractedOntology getOntology() {
        return ontology;
    }

    @Override
    public IRI getOntologyIri() {
        return (IRI) ontology.getResource();
    }

    @Override
    public String uuid() {
        return UUID.randomUUID().toString();
    }
}
