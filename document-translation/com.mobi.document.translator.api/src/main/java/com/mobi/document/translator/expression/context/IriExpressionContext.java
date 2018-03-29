package com.mobi.document.translator.expression.context;

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

import com.mobi.rdf.api.IRI;
import com.mobi.document.translator.ontology.ExtractedOntology;

/**
 * This interface describes the base information that is required for a {@link IRI} to be generated in general.
 */
public interface IriExpressionContext {

    /**
     * @return The {@link ExtractedOntology} you're working with
     */
    ExtractedOntology getOntology();

    /**
     * @return The {@link IRI} of the ontology, represented as a {@link String}
     */
    String getOntologyIri();

    /**
     * @return A random UUID value as a {@link String}
     */
    String uuid();

}
