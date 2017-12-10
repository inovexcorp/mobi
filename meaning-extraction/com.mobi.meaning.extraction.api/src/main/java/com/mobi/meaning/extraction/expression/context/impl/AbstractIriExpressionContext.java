package com.mobi.meaning.extraction.expression.context.impl;

import com.mobi.meaning.extraction.expression.context.IriExpressionContext;
import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.rdf.api.IRI;

import javax.validation.constraints.NotNull;
import java.util.UUID;

public class AbstractIriExpressionContext implements IriExpressionContext {

    protected final ExtractedOntology ontology;

    public AbstractIriExpressionContext(@NotNull ExtractedOntology ontology) {
        this.ontology = ontology;
    }

    @Override
    public ExtractedOntology getOntology() {
        return ontology;
    }

    @Override
    public String getOntologyIri() {
        return ontology.getResource().stringValue();
    }

    @Override
    public String uuid() {
        return UUID.randomUUID().toString();
    }
}
