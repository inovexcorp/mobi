package com.mobi.document.translator.expression;

/*-
 * #%L
 * meaning.extraction.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.document.translator.SemanticTranslationException;
import com.mobi.document.translator.expression.context.IriExpressionContext;
import org.eclipse.rdf4j.model.IRI;

/**
 * This interface describes an class that will process the expressions that represent what amount to templates for
 * the {@link IRI}s that are generated for both ontological structures in your translation, as well as instances in the
 * resulting {@link org.eclipse.rdf4j.model.Model>} containing the individuals represented in your incoming data.
 */
public interface IriExpressionProcessor {

    /**
     * Process an expression given a context.
     *
     * @param expression The {@link String} expression that will result in an IRI
     * @param context    The {@link IriExpressionContext} that provides contextual information about where you are in your
     *                   processing
     * @return The {@link IRI} generated by the expression
     * @throws SemanticTranslationException If there is an issue generating the {@link IRI} from the given expression
     *                                      and context
     */
    IRI processExpression(String expression, IriExpressionContext context) throws SemanticTranslationException;

}
