package com.mobi.security.policy.rest;

/*-
 * #%L
 * com.mobi.security.policy.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;
import static com.mobi.web.security.util.AuthenticationProps.ANON_USER;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = PolicyEnforcementRest.class, immediate = true)
@JaxrsResource
@Path("/pep")
public class PolicyEnforcementRest {

    private final Logger log = LoggerFactory.getLogger(PolicyEnforcementRest.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    private PDP pdp;
    private final ValueFactory vf = new ValidatingValueFactory();
    private EngineManager engineManager;

    @Reference
    void setPdp(PDP pdp) {
        this.pdp = pdp;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    /**
     * Converts a user provided JSON object string into a XACML request. Evaluates the request and returns the decision
     * result. An example request would have a JSON object of:
     * {
     *     "resourceId": "http://mobi.com/catalog-local",
     *     "actionId": "http://mobi.com/ontologies/policy#Create",
     *     "actionAttrs": {
     *     "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":"http://mobi.com/ontologies/ontology-editor#OntologyRecord"
     *     }
     * }
     *
     * @param servletRequest the HttpServletRequest
     * @param jsonRequest a JSON object containing XACML required fields
     * @return the decision of the XACML request evaluation
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "pep",
            summary = "Converts user provided request into XACML and evaluates",
            responses = {
                    @ApiResponse(responseCode = "200", description = "the decision of the XACML request evaluation"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response evaluateRequest(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "A JSON object containing XACML required fields", required = true)
                    String jsonRequest) {
        log.debug("Authorizing...");
        long start = System.currentTimeMillis();
        try {
            ObjectNode json = mapper.readValue(jsonRequest, ObjectNode.class);
            IRI subjectId = (IRI) RestUtils.optActiveUser(servletRequest, engineManager).map(User::getResource)
                    .orElse(vf.createIRI(ANON_USER));

            String actionIdStr = Optional.ofNullable(json.get("actionId"))
                    .orElseThrow(() -> new IllegalArgumentException("Action ID is required")).asText();
            String resourceIdStr = Optional.ofNullable(json.get("resourceId"))
                    .orElseThrow(() -> new IllegalArgumentException("Resource Id is required")).asText();

            IRI actionId = vf.createIRI(actionIdStr);
            IRI resourceId = vf.createIRI(resourceIdStr);

            Map<String, Literal> subjectAttrs = getAttrMap("subjectAttrs", json);
            Map<String, Literal> resourceAttrs = getAttrMap("resourceAttrs", json);
            Map<String, Literal> actionAttrs = getAttrMap("actionAttrs", json);

            Request request = pdp.createRequest(Collections.singletonList(subjectId), subjectAttrs,
                    Collections.singletonList(resourceId), resourceAttrs,
                    Collections.singletonList(actionId), actionAttrs);

            log.debug(request.toString());
            com.mobi.security.policy.api.Response response = pdp.evaluate(request,
                    vf.createIRI(POLICY_PERMIT_OVERRIDES));
            log.debug(response.toString());
            log.debug(String.format("Request Evaluated. %dms", System.currentTimeMillis() - start));

            return Response.ok(response.getDecision().toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (JsonProcessingException | MobiException ex) {
            throw ErrorUtils.sendError("Request could not be evaluated", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Converts a user provided JSON object string into a XACML request. Evaluates the request and returns an array of
     * XACML responses as the result. An example request would have a JSON object of:
     * {
     *     "resourceId": ["https://mobi.com/records#111a111b-00ee-410a-832f-f67c5c10b33d"],
     *     "actionId": ["http://mobi.com/ontologies/policy#Delete"]
     * }
     *
     * @param servletRequest the request supplied by the underlying JAX-RS implementation
     * @param jsonRequest a JSON object containing XACML required fields
     * @return an array of xacml responses to the jsonRequest
     */
    @POST
    @Path("/multiDecisionRequest")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "pep",
            summary = "Converts user provided requests into XACML and evaluates",
            responses = {
                    @ApiResponse(responseCode = "200", description = "the XACML Responses for the corresponding XACML"
                            + " requests"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response evaluateMultiDecisionRequest(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "A JSON object with XACML required fields", required = true)
                    String jsonRequest) {
        log.debug("Authorizing...");
        long start = System.currentTimeMillis();
        try {
            ObjectNode json = mapper.readValue(jsonRequest, ObjectNode.class);
            IRI subjectId = (IRI) RestUtils.optActiveUser(servletRequest, engineManager).map(User::getResource)
                    .orElse(vf.createIRI(ANON_USER));

            List<IRI> actionIds = json.hasNonNull("actionId") && json.get("actionId").isArray()
                    ? StreamSupport.stream(json.get("actionId").spliterator(), false)
                            .map(JsonNode::asText)
                            .map(vf::createIRI)
                            .collect(Collectors.toList())
                    : Collections.emptyList();
            List<IRI> resourceIds = json.hasNonNull("resourceId") && json.get("resourceId").isArray()
                    ? StreamSupport.stream(json.get("resourceId").spliterator(), false)
                            .map(JsonNode::asText)
                            .map(vf::createIRI)
                            .collect(Collectors.toList())
                    : Collections.emptyList();

            if (resourceIds.size() > 1 && actionIds.size() > 1) {
                throw ErrorUtils.sendError("Only one field may have more than one value.", Response.Status.BAD_REQUEST);
            }

            Map<String, Literal> subjectAttrs = getAttrMap("subjectAttrs", json);
            Map<String, Literal> resourceAttrs = getAttrMap("resourceAttrs", json);
            Map<String, Literal> actionAttrs = getAttrMap("actionAttrs", json);

            Request request = pdp.createRequest(Collections.singletonList(subjectId), subjectAttrs, resourceIds,
                    resourceAttrs, actionIds, actionAttrs);

            log.debug(request.toString());
            ArrayNode response = pdp.evaluateMultiResponse(request,
                    vf.createIRI(POLICY_PERMIT_OVERRIDES));
            log.debug(response.toString());
            log.debug(String.format("Request Evaluated. %dms", System.currentTimeMillis() - start));

            return Response.ok(response.toString()).build();
        } catch (JsonProcessingException | IllegalArgumentException | MobiException ex) {
            throw ErrorUtils.sendError("Request could not be evaluated", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Map<String, Literal> getAttrMap(String property, ObjectNode json) {
        return json.hasNonNull(property) ? json.get(property)
                .properties()
                .stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> vf.createLiteral(entry.getValue().asText())))
                : Collections.emptyMap();
    }

    private String getMessageOrDefault(com.mobi.security.policy.api.Response response, String defaultMessage) {
        return StringUtils.isEmpty(response.getStatusMessage()) ? defaultMessage : response.getStatusMessage();
    }
}
