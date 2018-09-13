package com.mobi.security.policy.rest.impl;

import aQute.bnd.annotation.component.Reference;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.security.policy.api.exception.PolicySyntaxException;
import com.mobi.security.policy.api.ontologies.policy.Delete;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.security.policy.api.ontologies.policy.Update;
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
import com.mobi.security.policy.rest.RecordPermissionsRest;
import com.mobi.vocabularies.xsd.XSD;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import javax.ws.rs.core.Response;
import javax.xml.bind.JAXBElement;
import javax.xml.namespace.QName;

public class RecordPermissionsRestImpl implements RecordPermissionsRest {
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

    private XACMLPolicy recordJsonToPolicy(String json, PolicyType policyType) {
        String masterBranch = policyType.getRule().get(4).getTarget().getAnyOf().get(0).getAllOf().get(0).getMatch()
                .get(1).getAttributeValue().getContent().get(0).toString();
        policyType.getRule().clear();

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
        groupAttrDesig.setAttributeId("http://mobi.com/policy/prop-path(%5E%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2Fmember%3E)");
        groupAttrDesig.setCategory(XACML.SUBJECT_CATEGORY);
        groupAttrDesig.setDataType(XSD.STRING);
        groupAttrDesig.setMustBePresent(true);

        AttributeDesignatorType userRoleAttrDesig = new AttributeDesignatorType();
        userRoleAttrDesig.setAttributeId(User.hasUserRole_IRI);
        userRoleAttrDesig.setCategory(XACML.SUBJECT_CATEGORY);
        userRoleAttrDesig.setDataType(XSD.STRING);
        userRoleAttrDesig.setMustBePresent(true);

        AttributeValueType userRoleAttrVal = new AttributeValueType();
        userRoleAttrVal.setDataType(XSD.STRING);
        userRoleAttrVal.getContent().add("http://mobi.com/roles/user");

        AttributeDesignatorType branchAttrDesig = new AttributeDesignatorType();
        branchAttrDesig.setAttributeId("http://mobi.com/ontologies/catalog#branch");
        branchAttrDesig.setCategory(XACML.ACTION_CATEGORY);
        branchAttrDesig.setDataType(XSD.STRING);
        branchAttrDesig.setMustBePresent(false);

        AttributeValueType branchAttrVal = new AttributeValueType();
        branchAttrVal.setDataType(XSD.STRING);
        branchAttrVal.getContent().add(masterBranch);

        JSONObject jsonObject = JSONObject.fromObject(json);
        Iterator<?> keys = jsonObject.keys();

        while (keys.hasNext()) {
            String key = (String)keys.next();
            JSONObject jsonRule = jsonObject.getJSONObject(key);

            RuleType rule = new RuleType();
            TargetType target = new TargetType();
            rule.setEffect(EffectType.PERMIT);
            rule.setRuleId(key);
            rule.setTarget(target);

            AttributeValueType ruleTypeAttrVal = new AttributeValueType();
            ruleTypeAttrVal.setDataType(XSD.STRING);

            // Setup Rule Type
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
                case "urn:modifyMaster":
                    ruleTypeAttrVal.getContent().add("http://mobi.com/ontologies/catalog#Modify");
                    break;
                default:
                    throw new MobiException("Invalid rule key: " + key);
            }

            AnyOfType anyOfType = new AnyOfType();
            AllOfType allOfType = new AllOfType();
            anyOfType.getAllOf().add(allOfType);
            allOfType.getMatch().add(ruleTypeMatch);

            if (key.equalsIgnoreCase("urn:modifyMaster")) {
                MatchType branchMatch = new MatchType();
                branchMatch.setMatchId(XACML.STRING_EQUALS);
                branchMatch.setAttributeDesignator(branchAttrDesig);
                branchMatch.setAttributeValue(branchAttrVal);
                allOfType.getMatch().add(branchMatch);
            }
            rule.getTarget().getAnyOf().add(anyOfType);

            // Setup Users
            AnyOfType usersGroups = new AnyOfType();
            if (jsonRule.getBoolean("everyone")) {
                MatchType userRoleMatch = new MatchType();
                userRoleMatch.setMatchId(XACML.STRING_EQUALS);
                userRoleMatch.setAttributeDesignator(userRoleAttrDesig);
                userRoleMatch.setAttributeValue(userRoleAttrVal);

                AllOfType everyoneAllOf = new AllOfType();
                everyoneAllOf.getMatch().add(userRoleMatch);
                usersGroups.getAllOf().add(everyoneAllOf);
            } else {
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
            }
            rule.getTarget().getAnyOf().add(usersGroups);

            if (key.equalsIgnoreCase("urn:modify")) {
                ConditionType condition = new ConditionType();
                condition.setExpression(createMasterBranchExpression(masterBranch));
                rule.setCondition(condition);
            }
            policyType.getRule().add(rule);
        }

        return policyManager.createPolicy(policyType);
    }

    private JAXBElement<?> createMasterBranchExpression(String masterBranch) {
        // Innermost expression list
        FunctionType strEqFunctionType = new FunctionType();
        strEqFunctionType.setFunctionId(XACML.STRING_EQUALS);
        JAXBElement<FunctionType> stringEqual = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Function"),
                FunctionType.class, strEqFunctionType);

        AttributeValueType branchAttrVal = new AttributeValueType();
        branchAttrVal.setDataType(XSD.STRING);
        branchAttrVal.getContent().add(masterBranch);
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

    private String recordPolicyToJson(XACMLPolicy policy) {
        List<RuleType> rules = policy.getJaxbPolicy().getRule();
        JSONObject json = new JSONObject();
        for (RuleType rule : rules) {
            JSONObject people = new JSONObject();
            final boolean[] everyone = {false};
            List<String> users = new ArrayList<>();
            List<String> groups = new ArrayList<>();
            rule.getTarget().getAnyOf().get(1).getAllOf().forEach(allOfType -> {
                String userOrGroup = allOfType.getMatch().get(0).getAttributeValue().getContent().get(0).toString();
                if (userOrGroup.contains("http://mobi.com/users/")) {
                    users.add(userOrGroup);
                } else if (userOrGroup.contains("http://mobi.com/groups")) {
                    groups.add(userOrGroup);
                } else if (userOrGroup.contains("http://mobi.com/roles/user")) {
                    everyone[0] = true;
                }
            });

            if (everyone[0]) {
                people.put("everyone", true);
                people.put("users", new String[0]);
                people.put("groups", new String[0]);
            } else {
                people.put("everyone", false);
                people.put("users", users);
                people.put("groups", groups);
            }
            json.put(rule.getRuleId(), people);
        }
        return json.toString();
    }
}
