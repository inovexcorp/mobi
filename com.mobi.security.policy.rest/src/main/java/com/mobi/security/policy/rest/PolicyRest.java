package com.mobi.security.policy.rest;

/*-
 * #%L
 * com.mobi.security.policy.rest
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

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/policies")
@Api(value = "/policies")
public interface PolicyRest {

    /**
     * Fetches all security policies that match the provided query parameters.
     *
     * @param relatedSubject The String representing a subject ID. NOTE: Assumes ID represents an IRI unless String
     *                       begins with "_:"
     * @param relatedResource The String representing a resource ID. NOTE: Assumes ID represents an IRI unless String
     *                       begins with "_:"
     * @param relatedAction The String representing a action ID. NOTE: Assumes ID represents an IRI unless String
     *                       begins with "_:"
     * @return A JSON array of JSON representations of matching policies
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves security policies matching the provided filters.")
    Response getPolicies(@QueryParam("relatedSubject") String relatedSubject,
                         @QueryParam("relatedResource") String relatedResource,
                         @QueryParam("relatedAction") String relatedAction);

    /**
     * Creates a new policy in Mobi using the provided JSON. Returns the new policy's ID which is gathered from the
     * provided JSON.
     *
     * @param policyJson A JSON representation of a policy to add to Mobi
     * @return The new policy ID
     */
    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @ApiOperation("Creates a new security policy using the provided JSON body.")
    Response createPolicy(String policyJson);

    /**
     * Retrieves a specific security policy identified by its ID. If the policy could not be found, returns a 400.
     *
     * @param policyId The String representing a policy ID. NOTE: Assumes ID represents an IRI unless String
     *                 begins with "_:"
     * @return A JSON representation of the identified policy
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{policyId}")
    @RolesAllowed("user")
    @ApiOperation("Retrieves a specific security policy by its ID.")
    Response retrievePolicy(@PathParam("policyId") String policyId);

    /**
     * Updates the identified policy with the provided JSON representation in the body. Provided policy must have
     * the same ID.
     *
     * @param policyId The String representing a policy ID. NOTE: Assumes ID represents an IRI unless String
     *                 begins with "_:"
     * @param policyJson A JSON representation of the new version of the policy
     * @return A Response indicating the success of the request
     */
    @PUT
    @Path("{policyId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @ApiOperation("Updates an existing security policy using the provided JSON body.")
    Response updatePolicy(@PathParam("policyId") String policyId, String policyJson);

    /**
     * Retrieves a specific record policy identified by its ID. If the policy could not be found, returns a 400.
     *
     * @param policyId The String representing a policy ID. NOTE: Assumes ID represents an IRI unless String
     *                 begins with "_:"
     * @return A JSON representation of the identified policy
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/record-permissions/{policyId}")
    @RolesAllowed("user")
    @ApiOperation("Retrieves a specific record security policy by its ID.")
    Response retrieveRecordPolicy(@PathParam("policyId") String policyId);

    /**
     * Updates the identified record policy with the provided JSON representation in the body. Provided policy must have
     * the same ID.
     *
     * @param policyId The String representing a policy ID. NOTE: Assumes ID represents an IRI unless String
     *                 begins with "_:"
     * @param policyJson A JSON representation of the new version of the policy
     * @return A Response indicating the success of the request
     */
    @PUT
    @Path("/record-permissions/{policyId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @ApiOperation("Updates an existing record security policy using the provided JSON body.")
    Response updateRecordPolicy(@PathParam("policyId") String policyId, String policyJson);
}
