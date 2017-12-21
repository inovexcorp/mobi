package com.mobi.semantic.translator.expression.context.impl;

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

import com.mobi.semantic.translator.expression.context.ClassIriExpressionContext;
import com.mobi.semantic.translator.ontology.ExtractedOntology;

import javax.validation.constraints.NotNull;

/**
 * The default implementation of the {@link ClassIriExpressionContext}.
 */
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
