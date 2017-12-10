package com.mobi.meaning.extraction.expression.context;

import com.mobi.meaning.extraction.ontology.ExtractedOntology;

public class DefaultClassIriExpressionContext extends AbstractIriExpressionContext implements ClassIriExpressionContext {

    private final String name;

    private final String comment;

    public DefaultClassIriExpressionContext(ExtractedOntology ontology, String name, String comment) {
        super(ontology);
        this.name = name;
        this.comment = comment;
    }

    @Override
    public String getName() {
        return null;
    }

    @Override
    public String getComment() {
        return null;
    }
}
