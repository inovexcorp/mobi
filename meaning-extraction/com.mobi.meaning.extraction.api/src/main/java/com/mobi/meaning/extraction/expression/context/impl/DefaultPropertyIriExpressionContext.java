package com.mobi.meaning.extraction.expression.context.impl;

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

import com.mobi.meaning.extraction.expression.context.PropertyIriExpressionContext;
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
