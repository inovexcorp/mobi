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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.module.jaxb.JaxbAnnotationModule;
import com.mobi.exception.MobiException;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.security.policy.api.exception.PolicySyntaxException;
import com.mobi.security.policy.api.xacml.PolicyQueryParams;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import com.mobi.security.policy.rest.PolicyRest;
import net.sf.json.JSONArray;
import org.apache.commons.lang3.StringUtils;

import java.io.IOException;
import java.util.Optional;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class PolicyRestImpl implements PolicyRest {

    private ValueFactory vf;
    private XACMLPolicyManager policyManager;

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setPolicyManager(XACMLPolicyManager policyManager) {
        this.policyManager = policyManager;
    }

    @Override
    public Response getPolicies(String relatedSubject, String relatedResource, String relatedAction) {
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
        try {
            return Response.ok(policyManager.getPolicies(params.build()).stream()
                    .map(this::policyToJson)
                    .collect(JSONArray::new, JSONArray::add, JSONArray::add)).build();
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, "Error retrieving policies", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createPolicy(String policyJson) {
        try {
            Resource policyId = policyManager.addPolicy(jsonToPolicy(policyJson));
            return Response.status(201).entity(policyId.stringValue()).build();
        } catch (IllegalArgumentException | PolicySyntaxException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, "Policy could not be created", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @ResourceId(type = ValueType.PATH, id = "policyId")
    public Response retrievePolicy(String policyId) {
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

    @Override
    @ResourceId(type = ValueType.PATH, id = "policyId")
    public Response updatePolicy(String policyId, String policyJson) {
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
                throw ErrorUtils.sendError("Policy must have a id", Response.Status.BAD_REQUEST);
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
