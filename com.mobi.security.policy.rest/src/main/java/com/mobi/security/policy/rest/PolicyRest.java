package com.mobi.security.policy.rest;

/*-
 * #%L
 * com.mobi.security.policy.rest
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

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.module.jaxb.JaxbAnnotationModule;
import com.mobi.exception.MobiException;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.security.policy.api.exception.PolicySyntaxException;
import com.mobi.security.policy.api.xacml.PolicyQueryParams;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import net.sf.json.JSONArray;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import java.io.IOException;
import java.util.Optional;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = PolicyRest.class, immediate = true)
@JaxrsResource
@Path("/policies")
public class PolicyRest {

    private final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    protected XACMLPolicyManager policyManager;

    /**
     * Fetches all security policies that match the provided query parameters.
     *
     * @param relatedSubject  Optional string representing a subject ID. NOTE: Assumes ID represents an IRI unless String
     *                        begins with "_:"
     * @param relatedResource Optional string representing a resource ID. NOTE: Assumes ID represents an IRI unless String
     *                        begins with "_:"
     * @param relatedAction   Optional string representing an action ID. NOTE: Assumes ID represents an IRI unless String
     *                        begins with "_:"
     * @param systemOnly      Boolean representing whether only system policies should be returned. Defaults to false
     * @return A JSON array of JSON representations of matching policies
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "policies",
            summary = "Retrieves security policies matching the provided filters",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getPolicies(
            @Parameter(description = "String representing a subject ID")
            @QueryParam("relatedSubject") String relatedSubject,
            @Parameter(description = "String representing a resource ID")
            @QueryParam("relatedResource") String relatedResource,
            @Parameter(description = "String representing a action ID")
            @QueryParam("relatedAction") String relatedAction,
            @Parameter(description = "Boolean of whether to only return system policies")
            @DefaultValue("false")
            @QueryParam("systemOnly") boolean systemOnly) {
        PolicyQueryParams.Builder params = new PolicyQueryParams.Builder();
        if (StringUtils.isNotEmpty(relatedResource)) {
            params.addResourceIRI(vf.createIRI(relatedResource));
        }
        if (StringUtils.isNotEmpty(relatedSubject)) {
            params.addSubjectIRI(vf.createIRI(relatedSubject));
        }
        if (StringUtils.isNotEmpty(relatedAction)) {
            params.addActionIRI(vf.createIRI(relatedAction));
        }
        if (systemOnly) {
            params.setSystemOnly(true);
        }
        try {
            return Response.ok(policyManager.getPolicies(params.build()).stream()
                    .map(this::policyToJson)
                    .collect(JSONArray::new, JSONArray::add, JSONArray::add)).build();
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, "Error retrieving policies", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

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
    @Operation(
            tags = "policies",
            summary = "Creates a new security policy using the provided JSON body",
            responses = {
                    @ApiResponse(responseCode = "201", description = "New policy ID"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response createPolicy(
            @Parameter(description = "A JSON representation of a policy to add to Mobi", required = true)
            String policyJson) {
        try {
            Resource policyId = policyManager.addPolicy(jsonToPolicy(policyJson));
            return Response.status(201).entity(policyId.stringValue()).build();
        } catch (IllegalArgumentException | PolicySyntaxException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, "Policy could not be created", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves a specific security policy identified by its ID. If the policy could not be found, returns a 400.
     *
     * @param policyId String representing a policy ID. NOTE: Assumes ID represents an IRI unless String
     *                 begins with "_:"
     * @return A JSON representation of the identified policy
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{policyId}")
    @RolesAllowed("user")
    @Operation(
            tags = "policies",
            summary = "Retrieves a specific security policy by its ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "A JSON representation of the identified policy"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "policyId")
    public Response retrievePolicy(
            @Parameter(description = "String representing a policy ID", required = true)
            @PathParam("policyId") String policyId) {
        try {
            Optional<XACMLPolicy> policy = policyManager.getPolicy(vf.createIRI(policyId));
            if (!policy.isPresent()) {
                throw ErrorUtils.sendError("Policy could not be found", Response.Status.BAD_REQUEST);
            }
            return Response.ok(policyToJson(policy.get())).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, "Policy could not be retrieved", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the identified policy with the provided JSON representation in the body. Provided policy must have
     * the same ID.
     *
     * @param policyId   String representing a policy ID. NOTE: Assumes ID represents an IRI unless String
     *                   begins with "_:"
     * @param policyJson A JSON representation of the new version of the policy
     * @return A Response indicating the success of the request
     */
    @PUT
    @Path("{policyId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Operation(
            tags = "policies",
            summary = "Updates an existing security policy using the provided JSON body",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Success"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "policyId")
    public Response updatePolicy(
            @Parameter(description = "String representing a policy ID", required = true)
            @PathParam("policyId") String policyId,
            @Parameter(description = "A JSON representation of the new version of the policy", required = true)
            String policyJson) {
        try {
            XACMLPolicy policy = jsonToPolicy(policyJson);
            if (!policy.getId().equals(vf.createIRI(policyId))) {
                throw ErrorUtils.sendError("Policy Id does not match provided policy", Response.Status.BAD_REQUEST);
            }
            policyManager.updatePolicy(policy);
            return Response.ok().build();
        } catch (IllegalArgumentException | PolicySyntaxException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, "Policy could not be updated", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private XACMLPolicy jsonToPolicy(String json) {
        try {
            PolicyType converted = getMapper().readValue(json, PolicyType.class);
            if (StringUtils.isEmpty(converted.getPolicyId())) {
                throw ErrorUtils.sendError("Policy must have a value", Response.Status.BAD_REQUEST);
            }
            return policyManager.createPolicy(converted);
        } catch (IOException ex) {
            throw ErrorUtils.sendError(ex, "Error converting policy", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private String policyToJson(XACMLPolicy policy) {
        try {
            return getMapper().writeValueAsString(policy.getJaxbPolicy());
        } catch (JsonProcessingException ex) {
            throw ErrorUtils.sendError(ex, "Error converting policy", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private ObjectMapper getMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JaxbAnnotationModule());
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        return objectMapper;
    }
}
