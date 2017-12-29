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

import com.mobi.rdf.api.IRI;

/**
 * This interface describes the context required for generating the {@link IRI} for a
 * {@link com.mobi.semantic.translator.ontology.ExtractedProperty}.
 */
public interface PropertyIriExpressionContext extends IriExpressionContext {

    /**
     * @return The name of the property
     */
    String getName();

    /**
     * @return Comments associated with the property
     */
    String getComment();

    /**
     * @return The {@link IRI} representing the domain of the property
     */
    IRI getDomain();

    /**
     * @return The {@link IRI} representing the range of the property
     */
    IRI getRange();

}
