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
import com.mobi.rdf.api.Literal;

import java.util.Map;

public interface PDP {
    /**
     * Creates a new {@link Request} object with the provided details that is compatible with this PDP.
     *
     * @param subjectId The ID of the Subject of the Request.
     * @param subjectAttrs A map of other attributes on the Subject.
     * @param resourceId The ID of the Resource of the Request.
     * @param resourceAttrs A map of other attributes on the Resource.
     * @param actionId The ID of the Action of the Request.
     * @param actionAttrs A map of other attributes on the Action.
     * @return A Request in the appropriate format for this PDP
     */
    Request createRequest(IRI subjectId, Map<String, Literal> subjectAttrs, IRI resourceId,
                          Map<String, Literal> resourceAttrs, IRI actionId, Map<String, Literal> actionAttrs);

    /**
     * Evaluates an authorization {@link Request} against a collection of {@link Policy Policies} combined
     * with a default algorithm and returns a {@link Response} with the authorization {@link Decision}. Based on ABAC.
     * The PDP should process the Request attributes.
     *
     * @param request An authorization Request
     * @return A Response with the Decision of the Request
     */
    Response evaluate(Request request);

    /**
     * Evaluates an authorization {@link Request} against a collection of {@link Policy Policies} combined
     * with the identified algorithm and returns a {@link Response} with the authorization {@link Decision}.
     * Based on ABAC. The PDP should process the Request attributes.
     *
     * @param request An authorization Request
     * @param policyAlgorithm The IRI identifier for a Policy algorithm for combining results
     * @return A Response with the Decision of the Request
     */
    Response evaluate(Request request, IRI policyAlgorithm);
}
