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

import com.mobi.rdf.api.IRI;
import org.w3c.dom.Document;

import java.util.Set;

public interface PIP {

    /**
     * Retrieves the Bag of {@link AttributeValue}s resulting from evaluating the attribute with the provided ID,
     * type, category, and issuer.
     *
     * @param attributeId The URI ID of the attribute to find
     * @param attributeType The URI type of the attribute to find (typically XSD datatype)
     * @param categoryIRI The URI category with the specified attribute
     * @param issuer A string representation of the issuer of the attribute
     * @param request An XACML XML request object for context
     * @return A set of attribute values of the identified attribute; empty if attribute could not be found
     */
    Set<AttributeValue> findAttribute(IRI attributeId, IRI attributeType, IRI categoryIRI, String issuer,
                                      Document request);
}
