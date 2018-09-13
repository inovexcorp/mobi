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
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.security.policy.api.exception.PolicySyntaxException;
import com.mobi.security.policy.api.ontologies.policy.Delete;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.security.policy.api.ontologies.policy.Update;
import com.mobi.security.policy.api.xacml.PolicyQueryParams;
import com.mobi.security.policy.api.xacml.XACML;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.security.policy.api.xacml.jaxb.AllOfType;
import com.mobi.security.policy.api.xacml.jaxb.AnyOfType;
import com.mobi.security.policy.api.xacml.jaxb.ApplyType;
import com.mobi.security.policy.api.xacml.jaxb.AttributeDesignatorType;
import com.mobi.security.policy.api.xacml.jaxb.AttributeValueType;
import com.mobi.security.policy.api.xacml.jaxb.ConditionType;
import com.mobi.security.policy.api.xacml.jaxb.EffectType;
import com.mobi.security.policy.api.xacml.jaxb.FunctionType;
import com.mobi.security.policy.api.xacml.jaxb.MatchType;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import com.mobi.security.policy.api.xacml.jaxb.RuleType;
import com.mobi.security.policy.api.xacml.jaxb.TargetType;
import com.mobi.security.policy.rest.PolicyRest;
import com.mobi.vocabularies.xsd.XSD;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import javax.ws.rs.core.Response;
import javax.xml.bind.JAXBElement;
import javax.xml.namespace.QName;

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
    @ActionId(id = Update.TYPE)
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

    @Override
    @ResourceId(type = ValueType.PATH, id = "policyId")
    public Response retrieveRecordPolicy(String policyId) {
        try {
            Optional<XACMLPolicy> policy = policyManager.getPolicy(vf.createIRI(policyId));
            if (!policy.isPresent()) {
                throw ErrorUtils.sendError("Policy could not be found", Response.Status.BAD_REQUEST);
            }

            return Response.ok(recordPolicyToJson(policy.get())).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, "Policy could not be retrieved", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @ActionId(id = Update.TYPE)
    @ResourceId(type = ValueType.PATH, id = "policyId")
    public Response updateRecordPolicy(String policyId, String policyJson) {
        try {
            Optional<XACMLPolicy> policy = policyManager.getPolicy(vf.createIRI(policyId));
            if (!policy.isPresent()) {
                throw ErrorUtils.sendError("Record policy to update could not be found", Response.Status.BAD_REQUEST);
            }
            XACMLPolicy updatedPolicy = recordJsonToPolicy(policyJson, policy.get().getJaxbPolicy());

            if (!updatedPolicy.getId().equals(vf.createIRI(policyId))) {
                throw ErrorUtils.sendError("Policy Id does not match provided policy", Response.Status.BAD_REQUEST);
            }
            policyManager.updatePolicy(updatedPolicy);
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

    private XACMLPolicy recordJsonToPolicy(String json, PolicyType policyType) {
        AttributeDesignatorType actionIdAttrDesig = new AttributeDesignatorType();
        actionIdAttrDesig.setAttributeId(XACML.ACTION_ID);
        actionIdAttrDesig.setCategory(XACML.ACTION_CATEGORY);
        actionIdAttrDesig.setDataType(XSD.STRING);
        actionIdAttrDesig.setMustBePresent(true);

        AttributeDesignatorType subjectIdAttrDesig = new AttributeDesignatorType();
        subjectIdAttrDesig.setAttributeId(XACML.SUBJECT_ID);
        subjectIdAttrDesig.setCategory(XACML.SUBJECT_CATEGORY);
        subjectIdAttrDesig.setDataType(XSD.STRING);
        subjectIdAttrDesig.setMustBePresent(true);

        AttributeDesignatorType groupAttrDesig = new AttributeDesignatorType();
        subjectIdAttrDesig.setAttributeId("http://mobi.com/policy/prop-path(%5E%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2Fmember%3E)");
        subjectIdAttrDesig.setCategory(XACML.SUBJECT_CATEGORY);
        subjectIdAttrDesig.setDataType(XSD.STRING);
        subjectIdAttrDesig.setMustBePresent(true);

        AttributeDesignatorType userRoleAttrDesig = new AttributeDesignatorType();
        userRoleAttrDesig.setAttributeId(User.hasUserRole_IRI);
        userRoleAttrDesig.setCategory(XACML.SUBJECT_CATEGORY);
        userRoleAttrDesig.setDataType(XSD.STRING);
        userRoleAttrDesig.setMustBePresent(true);

        AttributeValueType userRoleAttrVal = new AttributeValueType();
        userRoleAttrVal.setDataType(XSD.STRING);
        userRoleAttrVal.getContent().add("http://mobi.com/roles/user");

        JSONObject jsonObject = JSONObject.fromObject(json);
        Iterator<?> keys = jsonObject.keys();
        policyType.getRule().clear();

        while (keys.hasNext()) {
            String key = (String)keys.next();
            JSONObject jsonRule = jsonObject.getJSONObject(key);
            if (key.equalsIgnoreCase("urn:modifyMaster")) {
                List<JAXBElement<?>> orExpressions = new ArrayList<>();
                orExpressions.add(createMasterBranchExpression(jsonRule));

                if (jsonRule.getBoolean("everyone")) {
                    orExpressions.add(createUserExpression("http://mobi.com/roles/user"));
                } else {
                    JSONArray jsonArray = jsonRule.getJSONArray("users");
                    jsonArray.addAll(jsonRule.getJSONArray("groups"));
                    for (int i = 0; i < jsonArray.size(); i++) {
                        orExpressions.add(createUserExpression(jsonArray.getString(i)));
                    }
                }

                // OR the branchIRI from the AnyOf
                ApplyType orApplyType = new ApplyType();
                orApplyType.setFunctionId(XACML.OR_FUNCTION);
                orApplyType.getExpression().addAll(orExpressions);
                JAXBElement<ApplyType> conditionOr = new JAXBElement<>(
                        new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Apply"),
                        ApplyType.class, orApplyType);

                ConditionType condition = new ConditionType();
                condition.setExpression(conditionOr);
                policyType.getRule().get(3).setCondition(condition);
                continue;
            }
            RuleType rule = new RuleType();
            TargetType target = new TargetType();
            rule.setEffect(EffectType.PERMIT);
            rule.setRuleId(key);
            rule.setTarget(target);

            AttributeValueType ruleTypeAttrVal = new AttributeValueType();
            ruleTypeAttrVal.setDataType(XSD.STRING);

            MatchType ruleTypeMatch = new MatchType();
            ruleTypeMatch.setMatchId(XACML.STRING_EQUALS);
            ruleTypeMatch.setAttributeDesignator(actionIdAttrDesig);
            ruleTypeMatch.setAttributeValue(ruleTypeAttrVal);
            ruleTypeAttrVal.getContent().clear();
            switch (key) {
                case "urn:read":
                    ruleTypeAttrVal.getContent().add(Read.TYPE);
                    break;
                case "urn:delete":
                    ruleTypeAttrVal.getContent().add(Delete.TYPE);
                    break;
                case "urn:update":
                    ruleTypeAttrVal.getContent().add(Update.TYPE);
                    break;
                case "urn:modify":
                    ruleTypeAttrVal.getContent().add("http://mobi.com/ontologies/catalog#Modify");
                    break;
                default:
                    throw new MobiException("Invalid rule key: " + key);
            }

            AnyOfType anyOfType = new AnyOfType();
            AllOfType allOfType = new AllOfType();
            anyOfType.getAllOf().add(allOfType);
            allOfType.getMatch().add(ruleTypeMatch);
            rule.getTarget().getAnyOf().add(anyOfType);

            if (jsonRule.getBoolean("everyone")) {
                MatchType userRoleMatch = new MatchType();
                userRoleMatch.setMatchId(XACML.STRING_EQUALS);
                userRoleMatch.setAttributeDesignator(userRoleAttrDesig);
                userRoleMatch.setAttributeValue(userRoleAttrVal);

                allOfType.getMatch().add(userRoleMatch);
            } else {
                AnyOfType usersGroups = new AnyOfType();
                JSONArray jsonArray = jsonRule.getJSONArray("users");
                jsonArray.addAll(jsonRule.getJSONArray("groups"));
                for (int i = 0; i < jsonArray.size(); i++) {
                    AttributeValueType userAttrVal = new AttributeValueType();
                    userAttrVal.setDataType(XSD.STRING);
                    userAttrVal.getContent().add(jsonArray.getString(i));

                    MatchType userMatch = new MatchType();
                    if (jsonArray.getString(i).contains("http://mobi.com/groups")) {
                        userMatch.setAttributeDesignator(groupAttrDesig);
                    } else {
                        userMatch.setAttributeDesignator(subjectIdAttrDesig);
                    }
                    userMatch.setAttributeValue(userAttrVal);

                    AllOfType userAllOf = new AllOfType();
                    userAllOf.getMatch().add(userMatch);

                    usersGroups.getAllOf().add(userAllOf);
                }

                rule.getTarget().getAnyOf().add(usersGroups);
            }


            policyType.getRule().add(rule);
        }

        return policyManager.createPolicy(policyType);
    }

    private JAXBElement<?> createMasterBranchExpression(JSONObject jsonRule) {
        // Innermost expression list
        FunctionType strEqFunctionType = new FunctionType();
        strEqFunctionType.setFunctionId(XACML.STRING_EQUALS);
        JAXBElement<FunctionType> stringEqual = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Function"),
                FunctionType.class, strEqFunctionType);

        AttributeValueType branchAttrVal = new AttributeValueType();
        branchAttrVal.setDataType(XSD.STRING);
        branchAttrVal.getContent().add(jsonRule.getString("master"));
        JAXBElement<AttributeValueType> branchValue = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "AttributeValue"),
                AttributeValueType.class, branchAttrVal);

        AttributeDesignatorType branchAttrDesig = new AttributeDesignatorType();
        branchAttrDesig.setAttributeId("http://mobi.com/ontologies/catalog#branch");
        branchAttrDesig.setCategory(XACML.ACTION_CATEGORY);
        branchAttrDesig.setDataType(XSD.STRING);
        branchAttrDesig.setMustBePresent(false);
        JAXBElement<AttributeDesignatorType> branchDesignator = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "AttributeDesignator"),
                AttributeDesignatorType.class, branchAttrDesig);

        List<JAXBElement<?>> branchExpression = Arrays.asList(stringEqual, branchValue, branchDesignator);

        // AnyOf the branchIRI
        ApplyType branchAnyOfApply = new ApplyType();
        branchAnyOfApply.setFunctionId(XACML.ANY_OF_FUNCTION);
        branchAnyOfApply.getExpression().addAll(branchExpression);
        JAXBElement<ApplyType> branchAnyOf = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Apply"),
                ApplyType.class, branchAnyOfApply);

        // Not the branchIRI from the AnyOf
        ApplyType branchNotApply = new ApplyType();
        branchNotApply.setFunctionId(XACML.NOT_FUNCTION);
        branchNotApply.getExpression().add(branchAnyOf);
        JAXBElement<ApplyType> branchNot = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Apply"),
                ApplyType.class, branchNotApply);
        return branchNot;
    }

    private JAXBElement<?> createUserExpression(String userIRI) {
        // Innermost expression list
        FunctionType strEqFunctionType = new FunctionType();
        strEqFunctionType.setFunctionId(XACML.STRING_EQUALS);
        JAXBElement<FunctionType> stringEqual = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Function"),
                FunctionType.class, strEqFunctionType);

        AttributeValueType userAttrVal = new AttributeValueType();
        userAttrVal.setDataType(XSD.STRING);
        userAttrVal.getContent().add(userIRI);
        JAXBElement<AttributeValueType> userValue = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "AttributeValue"),
                AttributeValueType.class, userAttrVal);

        AttributeDesignatorType userAttrDesig = new AttributeDesignatorType();
        if (userIRI.contains("http://mobi.com/groups")) {
            userAttrDesig.setAttributeId("http://mobi.com/policy/prop-path(%5E%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2Fmember%3E)");
        } else {
            userAttrDesig.setAttributeId(XACML.SUBJECT_ID);
        }
        userAttrDesig.setCategory(XACML.SUBJECT_CATEGORY);
        userAttrDesig.setDataType(XSD.STRING);
        userAttrDesig.setMustBePresent(true);
        JAXBElement<AttributeDesignatorType> userDesignator = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "AttributeDesignator"),
                AttributeDesignatorType.class, userAttrDesig);

        List<JAXBElement<?>> userExpression = Arrays.asList(stringEqual, userValue, userDesignator);

        // AnyOf the userIRI
        ApplyType userAnyOfApply = new ApplyType();
        userAnyOfApply.setFunctionId(XACML.ANY_OF_FUNCTION);
        userAnyOfApply.getExpression().addAll(userExpression);
        JAXBElement<ApplyType> userAnyOf = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Apply"),
                ApplyType.class, userAnyOfApply);

        // OR the branchIRI from the AnyOf
        ApplyType userOrApply = new ApplyType();
        userOrApply.setFunctionId(XACML.OR_FUNCTION);
        userOrApply.getExpression().add(userAnyOf);
        JAXBElement<ApplyType> userOr = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Apply"),
                ApplyType.class, userOrApply);
        return userOr;
    }

    private String recordPolicyToJson(XACMLPolicy policy) {
        List<RuleType> rules = policy.getJaxbPolicy().getRule();
        JSONObject json = new JSONObject();
        for (RuleType rule : rules) {
            JSONObject people = new JSONObject();
            final boolean[] everyone = {false};
            rule.getTarget().getAnyOf().get(0).getAllOf().get(0).getMatch().forEach(matchType -> {
                if (matchType.getAttributeValue().getContent().contains("http://mobi.com/roles/user")) {
                    everyone[0] = true;
                }
            });

            if (everyone[0]) {
                people.put("everyone", true);
                people.put("users", new String[0]);
                people.put("groups", new String[0]);
            } else {
                List<String> users = new ArrayList<>();
                List<String> groups = new ArrayList<>();
                rule.getTarget().getAnyOf().get(1).getAllOf().forEach(allOfType -> {
                    String userOrGroup = allOfType.getMatch().get(0).getAttributeValue().getContent().get(0).toString();
                    if (userOrGroup.contains("http://mobi.com/users/")) {
                        users.add(userOrGroup);
                    } else if (userOrGroup.contains("http://mobi.com/groups")) {
                        groups.add(userOrGroup);
                    }
                });

                people.put("users", users);
                people.put("groups", groups);
            }

            json.put(rule.getRuleId(), people);
        }
        JSONObject modifyJson = json.getJSONObject("urn:modify");
        ConditionType condition = rules.get(3).getCondition();
        List<JAXBElement<?>> orExpression = (List<JAXBElement<?>>) condition.getExpression().getValue();
        //TODO: GET THE REST OF THIS
        return json.toString();
    }

    private ObjectMapper getMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JaxbAnnotationModule());
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        return objectMapper;
    }
}
