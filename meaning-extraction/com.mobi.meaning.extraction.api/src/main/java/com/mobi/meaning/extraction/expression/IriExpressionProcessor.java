package com.mobi.meaning.extraction.expression;

import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.expression.context.IriExpressionContext;
import com.mobi.rdf.api.IRI;

public interface IriExpressionProcessor {

    IRI processExpression(String expression, IriExpressionContext context) throws MeaningExtractionException;

}
