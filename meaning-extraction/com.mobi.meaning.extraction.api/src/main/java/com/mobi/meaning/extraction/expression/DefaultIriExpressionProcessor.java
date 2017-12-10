package com.mobi.meaning.extraction.expression;

import aQute.bnd.annotation.component.Component;

import aQute.bnd.annotation.component.Reference;
import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.expression.context.IriExpressionContext;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;


@Component(immediate = true)
public class DefaultIriExpressionProcessor implements IriExpressionProcessor {

    private ValueFactory valueFactory;

    private ModelFactory modelFactory;

    @Override
    public IRI processExpression(String expression, IriExpressionContext context) throws MeaningExtractionException {
        return null;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }
}
