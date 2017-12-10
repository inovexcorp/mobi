package com.mobi.meaning.extraction.expression.context;

import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.rdf.api.IRI;

public interface PropertyIriExpressionContext extends IriExpressionContext {

    String getName();

    String getComment();

    IRI getDomain();

    IRI getRange();

}
