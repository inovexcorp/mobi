package com.mobi.meaning.extraction.expression.context;

import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.rdf.api.IRI;

import javax.validation.constraints.NotNull;

public class DefaultPropertyIriExpressionContext extends AbstractIriExpressionContext implements PropertyIriExpressionContext {

    private final String name;

    private final String comment;

    private final IRI domain;

    private final IRI range;

    public DefaultPropertyIriExpressionContext(@NotNull ExtractedOntology ontology, @NotNull String name, @NotNull String comment,
                                               @NotNull IRI domain, @NotNull IRI range) {
        super(ontology);
        this.name = name;
        this.comment = comment;
        this.domain = domain;
        this.range = range;
    }

    @Override
    public String getName() {
        return this.name;
    }

    @Override
    public String getComment() {
        return this.comment;
    }

    @Override
    public IRI getDomain() {
        return this.domain;
    }

    @Override
    public IRI getRange() {
        return this.range;
    }
}
