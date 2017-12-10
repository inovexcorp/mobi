package com.mobi.meaning.extraction.expression.context;

import com.mobi.meaning.extraction.ontology.ExtractedOntology;

import javax.validation.constraints.NotNull;

public class DefaultClassIriExpressionContext extends AbstractIriExpressionContext implements ClassIriExpressionContext {

    private final String name;

    private final String comment;

    public DefaultClassIriExpressionContext(@NotNull ExtractedOntology ontology, @NotNull String name, @NotNull String comment) {
        super(ontology);
        this.name = name;
        this.comment = comment;
    }

    @Override
    public String getName() {
        return this.name;
    }

    @Override
    public String getComment() {
        return this.comment;
    }
}
