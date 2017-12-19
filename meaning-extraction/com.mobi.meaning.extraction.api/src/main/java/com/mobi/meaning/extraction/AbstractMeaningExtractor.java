package com.mobi.meaning.extraction;

import com.mobi.meaning.extraction.expression.IriExpressionProcessor;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;

/**
 * This abstract base for the {@link MeaningExtractor} interface provides hooks to provide some base functionality to
 * avoid having to write the same boilerplate code in each implementation.
 */
public abstract class AbstractMeaningExtractor implements MeaningExtractor {

    private static final String XSD_PREFIX = "http://www.w3.org/2001/XMLSchema#";

    protected ValueFactory valueFactory;

    protected ModelFactory modelFactory;

    protected IriExpressionProcessor expressionProcessor;

    protected OrmFactoryRegistry ormFactoryRegistry;

    private IRI xsdString = null;

    private IRI xsdInt = null;

    private IRI xsdFloat = null;

    private IRI xsdBoolean = null;

    protected IRI xsdString() {
        if (xsdString == null) {
            xsdString = valueFactory.createIRI(XSD_PREFIX, "string");
        }
        return xsdString;
    }


    protected IRI xsdInt() {
        if (xsdInt == null) {
            xsdInt = valueFactory.createIRI(XSD_PREFIX, "int");
        }
        return xsdInt;
    }


    protected IRI xsdFloat() {
        if (xsdFloat == null) {
            xsdFloat = valueFactory.createIRI(XSD_PREFIX, "float");
        }
        return xsdFloat;
    }


    protected IRI xsdBoolean() {
        if (xsdBoolean == null) {
            xsdBoolean = valueFactory.createIRI(XSD_PREFIX, "boolean");
        }
        return xsdBoolean;
    }

}
