package com.mobi.semantic.translator.expression.context;

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

import java.util.Optional;

/**
 * This interface describes the context that is required for generating the {@link com.mobi.rdf.api.IRI} of an instance
 * of an {@link com.mobi.semantic.translator.ontology.ExtractedClass}.
 */
public interface InstanceIriExpressionContext extends IriExpressionContext {

    /**
     * @return The {@link com.mobi.rdf.api.IRI} of the class this instance will be of
     */
    String classIri();

    /**
     * Get the first value of a given predicate ({@link com.mobi.rdf.api.IRI} as a string) in the properties associated
     * with the instance.
     *
     * @param predicate The {@link String} representation of an {@link com.mobi.rdf.api.IRI}
     * @return The {@link Optional} wrapping the {@link String} representation of the first value for the specified
     * predicate
     */
    Optional<String> propertyValue(String predicate);

    /**
     * Get the first value of a given predicate ({@link com.mobi.rdf.api.IRI} as a string) in the properties associated
     * with the instance.  Default to a random UUID if the property doesn't exist.
     *
     * @param predicate The {@link String} representation of an {@link com.mobi.rdf.api.IRI}
     * @return The {@link String} representation of the first value for the specified, or a UUID if one isn't present
     */
    String propertyValueOrUUID(String predicate);

}
