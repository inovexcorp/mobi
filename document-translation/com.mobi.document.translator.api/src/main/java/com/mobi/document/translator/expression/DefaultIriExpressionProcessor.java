package com.mobi.document.translator.expression;

/*-
 * #%L
 * meaning.extraction.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.document.translator.SemanticTranslationException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.document.translator.expression.context.IriExpressionContext;
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

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Override
    public IRI processExpression(String expression, IriExpressionContext context) throws SemanticTranslationException {
        try {
            final Expression compiledExpression = PARSER.parseExpression(expression);
            String result = compiledExpression.getValue(new StandardEvaluationContext(context), String.class);
            LOG.debug("IRI expression resulted in '{}' with context of type {}", result, context.getClass().getName());
            return valueFactory.createIRI(result);
        } catch (SpelEvaluationException | SpelParseException | IllegalArgumentException e) {
            throw new SemanticTranslationException("Issue processing IRI expression for expression '"
                    + expression + "' with context of type: " + context.getClass().getName(), e);
        }
    }
}
