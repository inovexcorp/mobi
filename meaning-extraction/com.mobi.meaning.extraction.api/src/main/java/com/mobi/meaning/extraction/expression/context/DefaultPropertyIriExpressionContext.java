package com.mobi.meaning.extraction.expression.context;

import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.rdf.api.IRI;

public class DefaultPropertyIriExpressionContext extends AbstractIriExpressionContext implements PropertyIriExpressionContext {

    private final String name;

    private final String comment;

    private final IRI domain;

    private final IRI range;

    public DefaultPropertyIriExpressionContext(ExtractedOntology ontology, String name, String comment,
                                               IRI domain, IRI range) {
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
