package com.mobi.security.policy.rest.impl;

import static com.mobi.web.security.util.AuthenticationProps.ANON_USER;

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
import com.mobi.security.policy.rest.UserAccessRest;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

public class UserAccessRestImpl implements UserAccessRest {

    private final Logger log = LoggerFactory.getLogger(UserAccessRestImpl.class);

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
    public Response userAccess(ContainerRequestContext context, String jsonRequest) {
        log.info("Authorizing...");
        long start = System.currentTimeMillis();

        JSONObject json = JSONObject.fromObject(jsonRequest);
        IRI subjectId = (IRI) RestUtils.optActiveUser(context, engineManager).map(User::getResource)
                .orElse(vf.createIRI(ANON_USER));

        Map<String, Literal> subjectAttrs = json.getJSONObject("subjectAttrs");
        IRI resourceId = vf.createIRI(json.getString("resourceId"));
        Map<String, Literal> resourceAttrs = json.getJSONObject("resourceAttrs");
        IRI actionId = vf.createIRI(json.getString("actionId"));
        Map<String, Literal> actionAttrs = json.getJSONObject("actionAttrs");

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

        return Response.ok().build();
    }

    // TODO: Consolidate
    private String getMessageOrDefault(com.mobi.security.policy.api.Response response, String defaultMessage) {
        return StringUtils.isEmpty(response.getStatusMessage()) ? defaultMessage : response.getStatusMessage();
    }
}
