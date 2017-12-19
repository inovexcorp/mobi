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

import com.mobi.semantic.translator.expression.context.IriExpressionContext;
import com.mobi.semantic.translator.ontology.ExtractedOntology;
import com.mobi.rdf.api.IRI;

import javax.validation.constraints.NotNull;
import java.util.UUID;

public class AbstractIriExpressionContext implements IriExpressionContext {

    protected final ExtractedOntology ontology;

    public AbstractIriExpressionContext(@NotNull ExtractedOntology ontology) {
        this.ontology = ontology;
    }

    @Override
    public ExtractedOntology getOntology() {
        return ontology;
    }

    @Override
    public String getOntologyIri() {
        return ontology.getResource().stringValue();
    }

    @Override
    public String uuid() {
        return UUID.randomUUID().toString();
    }
}
