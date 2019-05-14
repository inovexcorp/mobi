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

import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;
import static com.mobi.web.security.util.AuthenticationProps.ANON_USER;

import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.stream.Collectors;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = PolicyEnforcementRest.class, immediate = true)
@Path("/pep")
@Api(value = "/pep")
public class PolicyEnforcementRest {

    private final Logger log = LoggerFactory.getLogger(PolicyEnforcementRest.class);

    private PDP pdp;
    private ValueFactory vf;
    private EngineManager engineManager;

    @Reference
    void setPdp(PDP pdp) {
        this.pdp = pdp;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
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
     * @param context the request context supplied by the underlying JAX-RS implementation
     * @param jsonRequest a JSON object containing XACML required fields
     * @return the decision of the XACML request evaluation
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @ApiOperation("Converts user provided request into XACML and evaluates.")
    public Response evaluateRequest(@Context ContainerRequestContext context, String jsonRequest) {
        log.debug("Authorizing...");
        long start = System.currentTimeMillis();

        try {
            JSONObject json = JSONObject.fromObject(jsonRequest);
            IRI subjectId = (IRI) RestUtils.optActiveUser(context, engineManager).map(User::getResource)
                    .orElse(vf.createIRI(ANON_USER));

            String actionIdStr = json.optString("actionId");
            String resourceIdStr = json.optString("resourceId");
            if (StringUtils.isEmpty(actionIdStr) || StringUtils.isEmpty(resourceIdStr)) {
                throw ErrorUtils.sendError("ID is required.", Response.Status.BAD_REQUEST);
            }

            IRI actionId = vf.createIRI(actionIdStr);
            IRI resourceId = vf.createIRI(resourceIdStr);

            Map<String, String> attributes = json.getJSONObject("subjectAttrs");
            Map<String, Literal> subjectAttrs = attributes.entrySet().stream().collect(Collectors.toMap(
                    e -> e.getKey(), e -> vf.createLiteral(e.getValue())));
            attributes = json.getJSONObject("resourceAttrs");
            Map<String, Literal> resourceAttrs = attributes.entrySet().stream().collect(Collectors.toMap(
                    e -> e.getKey(), e -> vf.createLiteral(e.getValue())));
            attributes = json.getJSONObject("actionAttrs");
            Map<String, Literal> actionAttrs = attributes.entrySet().stream().collect(Collectors.toMap(
                    e -> e.getKey(), e -> vf.createLiteral(e.getValue())));

            Request request = pdp.createRequest(subjectId, subjectAttrs, resourceId, resourceAttrs,
                    actionId, actionAttrs);

            log.debug(request.toString());
            com.mobi.security.policy.api.Response response = pdp.evaluate(request,
                    vf.createIRI(POLICY_PERMIT_OVERRIDES));
            log.debug(response.toString());
            log.debug(String.format("Request Evaluated. %dms", System.currentTimeMillis() - start));

            return Response.ok(response.getDecision().toString()).build();
        } catch (IllegalArgumentException | MobiException ex) {
            throw ErrorUtils.sendError("Request could not be evaluated", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private String getMessageOrDefault(com.mobi.security.policy.api.Response response, String defaultMessage) {
        return StringUtils.isEmpty(response.getStatusMessage()) ? defaultMessage : response.getStatusMessage();
    }
}
