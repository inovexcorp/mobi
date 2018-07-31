package com.mobi.security.policy.rest.impl;

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

import static com.mobi.web.security.util.AuthenticationProps.ANON_USER;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.rest.PolicyEnforcementRest;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.StopWatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class PolicyEnforcementRestImpl implements PolicyEnforcementRest {

    private final Logger log = LoggerFactory.getLogger(PolicyEnforcementRestImpl.class);

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

    @Override
    public Response evaluateRequest(ContainerRequestContext context, String jsonRequest) {
        log.info("Authorizing...");
        long start = System.currentTimeMillis();

        JSONObject json = JSONObject.fromObject(jsonRequest);
        IRI subjectId = (IRI) RestUtils.optActiveUser(context, engineManager).map(User::getResource)
                .orElse(vf.createIRI(ANON_USER));
        IRI actionId = vf.createIRI(json.getString("actionId"));
        IRI resourceId = vf.createIRI(json.getString("resourceId"));

        Map<String, String> attributes = json.getJSONObject("subjectAttrs");
        Map<String, Literal> subjectAttrs = attributes.entrySet().stream().collect(Collectors.toMap(e -> e.getKey(),
                e -> vf.createLiteral(e.getValue())));
        attributes = json.getJSONObject("resourceAttrs");
        Map<String, Literal> resourceAttrs = attributes.entrySet().stream().collect(Collectors.toMap(e -> e.getKey(),
                e -> vf.createLiteral(e.getValue())));
        attributes = json.getJSONObject("actionAttrs");
        Map<String, Literal> actionAttrs = attributes.entrySet().stream().collect(Collectors.toMap(e -> e.getKey(),
                e -> vf.createLiteral(e.getValue())));

        Request request = pdp.createRequest(subjectId, subjectAttrs, resourceId, resourceAttrs, actionId, actionAttrs);

        log.debug(request.toString());
        com.mobi.security.policy.api.Response response = pdp.evaluate(request);
        log.debug(response.toString());

        Decision decision = response.getDecision();
        if (decision != Decision.PERMIT) {
            if (decision == Decision.DENY) {
                String statusMessage = getMessageOrDefault(response,
                        "You do not have permission to perform this action");
                throw ErrorUtils.sendError(statusMessage, javax.ws.rs.core.Response.Status.UNAUTHORIZED);
            }
            if (decision == Decision.INDETERMINATE) {
                String statusMessage = getMessageOrDefault(response, "Request indeterminate");
                throw ErrorUtils.sendError(statusMessage, javax.ws.rs.core.Response.Status.INTERNAL_SERVER_ERROR);
            }
        }
        log.info(String.format("Request permitted. %dms", System.currentTimeMillis() - start));

        return Response.ok(decision.toString()).build();
    }

    // TODO: Consolidate
    private String getMessageOrDefault(com.mobi.security.policy.api.Response response, String defaultMessage) {
        return StringUtils.isEmpty(response.getStatusMessage()) ? defaultMessage : response.getStatusMessage();
    }
}
