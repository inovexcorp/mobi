package com.mobi.meaning.extraction.expression;

import aQute.bnd.annotation.component.Component;

import aQute.bnd.annotation.component.Reference;
import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.expression.context.IriExpressionContext;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.SpelEvaluationException;
import org.springframework.expression.spel.SpelParseException;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;


@Component(immediate = true)
public class DefaultIriExpressionProcessor implements IriExpressionProcessor {

    private static final Logger LOG = LoggerFactory.getLogger(DefaultIriExpressionProcessor.class);

    private static final ExpressionParser PARSER = new SpelExpressionParser();

    private ValueFactory valueFactory;

    @Override
    public IRI processExpression(String expression, IriExpressionContext context) throws MeaningExtractionException {
        try {
            final Expression compiledExpression = PARSER.parseExpression(expression);
            String result = compiledExpression.getValue(new StandardEvaluationContext(context), String.class);
            LOG.debug("IRI expression resulted in '{}' with context of type {}", result, context.getClass().getName());
            return valueFactory.createIRI(result);
        } catch (SpelEvaluationException | SpelParseException | IllegalArgumentException e) {
            throw new MeaningExtractionException("Issue processing IRI expression for expression '" + expression + "' with context of type: " + context.getClass().getName(), e);
        }
    }

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }
}
