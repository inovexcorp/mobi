package com.mobi.security.policy.api;

/*-
 * #%L
 * com.mobi.security.policy.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.fasterxml.jackson.databind.node.ArrayNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface PDP {
    /**
     * Creates a new {@link Request} object with the provided details that is compatible with this PDP.
     *
     * @param subjectIds The List of IDs for the Subjects of the Request.
     * @param subjectAttrs A map of other attributes on the Subject.
     * @param resourceIds The List of IDs for the Resources of the Request.
     * @param resourceAttrs A map of other attributes on the Resource.
     * @param actionIds The List of IDs for the Actions of the Request.
     * @param actionAttrs A map of other attributes on the Action.
     * @return A Request in the appropriate format for this PDP
     */
    Request createRequest(List<IRI> subjectIds, Map<String, Literal> subjectAttrs, List<IRI> resourceIds,
                          Map<String, Literal> resourceAttrs, List<IRI> actionIds, Map<String, Literal> actionAttrs);

    /**
     * Evaluates an authorization {@link Request} against a collection of {@link Policy Policies} combined
     * with a default algorithm and returns a {@link Response} with the authorization {@link Decision}. Based on ABAC.
     *
     * @param request An authorization Request
     * @return A Response with the Decision of the Request
     */
    Response evaluate(Request request);
    
    /**
     * Evaluates an authorization {@link Request} against a collection of {@link Policy Policies} combined
     * with the identified algorithm and returns a Set of Strings representing the resources that have an authorization
     * {@link Decision} of either PERMIT or NOT APPLICABLE.
     *
     * @param request An authorization Request
     * @param policyAlgorithm The IRI identifier for a Policy algorithm for combining results
     * @return A Response with the Decision of the Request
     */
    Set<String> filter(Request request, IRI policyAlgorithm);

    /**
     * Evaluates an authorization {@link Request} against a collection of {@link Policy Policies} combined
     * with the identified algorithm and returns a {@link Response} with the authorization {@link Decision}.
     * Based on ABAC.
     *
     * @param request An authorization Request
     * @param policyAlgorithm The IRI identifier for a Policy algorithm for combining results
     * @return A Response with the Decision of the Request
     */
    Response evaluate(Request request, IRI policyAlgorithm);

    /**
     * Evaluates an authorization {@link Request} against a collection of {@link Policy Policies} combined
     * with the identified algorithm and returns an Array of XACML Responses which include the authorization
     * {@link Decision}. Based on ABAC.
     *
     * @param request An authorization Request
     * @param policyAlgorithm The IRI identifier for a Policy algorithm for combining results
     * @return An array of XACML Responses that include the authorization decisions for each calculated request.
     */
    ArrayNode evaluateMultiResponse(Request request, IRI policyAlgorithm);
}
