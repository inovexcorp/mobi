package com.mobi.security.policy.api;

/*-
 * #%L
 * com.mobi.security.policy.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.Literal;
import com.mobi.security.policy.api.exception.MissingAttributeException;
import com.mobi.security.policy.api.exception.ProcessingException;

import java.util.List;

public interface PIP {

    /**
     * Looks for the Attribute that matches the {@link AttributeDesignator}, using values from the authorization
     * {@link Request} if needed, and returns its {@link Literal} values. Processing the attributes on the passed
     * Request is optional.
     *
     * @param attributeDesignator The aspects of an Attribute to match
     * @param request An authorization {@link Request}
     * @return The matched Attribute's {@link Literal} values
     * @throws MissingAttributeException If no Attribute is found that matches the passed aspects
     * @throws ProcessingException If some sort of problem occurs while processing the Attributes
     */
    List<Literal> findAttribute(AttributeDesignator attributeDesignator, Request request)
            throws MissingAttributeException, ProcessingException;
}
