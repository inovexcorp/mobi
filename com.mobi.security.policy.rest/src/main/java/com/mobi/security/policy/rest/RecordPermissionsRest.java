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

import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.security.policy.api.exception.PolicySyntaxException;
import com.mobi.security.policy.api.ontologies.policy.Delete;
import com.mobi.security.policy.api.ontologies.policy.Policy;
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
import com.mobi.vocabularies.xsd.XSD;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.bind.JAXBElement;
import javax.xml.namespace.QName;

@Component(service = RecordPermissionsRest.class, immediate = true)
@JaxrsResource
@Path("/record-permissions")
public class RecordPermissionsRest {
    private final Logger LOGGER = LoggerFactory.getLogger(RecordPermissionsRest.class);

    private static final String ONTOLOGIES_CATALOG_MODIFY = "http://mobi.com/ontologies/catalog#Modify";
    private final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    protected XACMLPolicyManager policyManager;

    @Reference(target = "(id=system)")
    protected OsgiRepository repo;

    /**
     * Retrieves a specific record policy JSON identified for the recordId of which users can perform each rule. If
     * the policy for the specified recordId could not be found, returns a 400. Return JSON is structured like:
     * {
     *   "urn:read": {
     *     "everyone": false,
     *     "users": [
     *       "http://mobi.com/users/userIRI1",
     *       "http://mobi.com/users/userIRI2"
     *     ],
     *     "groups": []
     *   }, ...
     * }
     *
     * @param recordId String representing a resource for which to retrieve a policy ID. NOTE: Assumes ID
     *                   represents an IRI unless String begins with "_:"
     * @return A JSON representation of which user can perform each rule.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{recordId}")
    @Operation(
            tags = "record-permissions",
            summary = "Retrieves a specific record security policy by its ID",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "JSON representation of which user can perform each rule",
                            content = @Content(
                                    examples = {@ExampleObject(value = "{"
                                            + "\"urn:read\": {"
                                            + "\"everyone\": false,"
                                            + "\"users\": [\n"
                                            + "\"http://mobi.com/users/userIRI1\","
                                            + "\"http://mobi.com/users/userIRI2\""
                                            + "],"
                                            + "\"groups\": []"
                                            + "  }, ..."
                                            + "}")
                                    })
                    ),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Update.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response retrieveRecordPolicy(
            @Parameter(description = "String representing a resource for which to retrieve a policy ID",
                    required = true)
            @PathParam("recordId") String recordId) {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<String> recordPolicyIdOpt = getRelatedResourceId(recordId, conn);
            String recordPolicyId = recordPolicyIdOpt.orElseThrow(() -> ErrorUtils.sendError("Policy for record "
                    + recordId + " does not exist in repository", Response.Status.BAD_REQUEST));

            Optional<XACMLPolicy> policy = policyManager.getPolicy(vf.createIRI(recordPolicyId));
            if (!policy.isPresent()) {
                throw ErrorUtils.sendError("Policy could not be found", Response.Status.BAD_REQUEST);
            }

            return Response.ok(recordPolicyToJson(policy.get())).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, "Policy could not be retrieved", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the record policy for the identified record recordId with the provided JSON representation in the body.
     * JSON object defines who has permission to perform each rule. Each rule is structured like:
     * {
     *   "urn:read": {
     *     "everyone": false,
     *     "users": [
     *       "http://mobi.com/users/userIRI1",
     *       "http://mobi.com/users/userIRI2"
     *     ],
     *     "groups": []
     *   }, ...
     * }
     *
     * @param recordId String representing a recordId whose corresponding policy should be updated.
     *                   NOTE: Assumes ID represents an IRI unless String begins with "_:"
     * @param policyJson A JSON representation of the new version of the record policy
     * @return A Response indicating the success of the request
     */
    @PUT
    @Path("{recordId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "record-permissions",
            summary = "Updates an existing record security policy using the provided JSON body",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response updateRecordPolicy(
            @Parameter(description = "String representing a recordId whose corresponding policy should be updated",
                    required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "JSON representation of the new version of the record policy", required = true)
                    String policyJson) {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Record Policy
            Optional<String> recordPolicyIdOpt = getRelatedResourceId(recordId, conn);
            String recordPolicyId = recordPolicyIdOpt.orElseThrow(() -> ErrorUtils.sendError("Policy for record "
                    + recordId + " does not exist in repository", Response.Status.BAD_REQUEST));
            IRI recordPolicyIRI = vf.createIRI(recordPolicyId);
            Optional<XACMLPolicy> recordPolicy = policyManager.getPolicy(recordPolicyIRI);
            if (!recordPolicy.isPresent()) {
                throw ErrorUtils.sendError("Record policy to update could not be found", Response.Status.BAD_REQUEST);
            }

            XACMLPolicy updatedRecordPolicy = recordJsonToPolicy(policyJson, recordPolicy.get().getJaxbPolicy());
            if (!updatedRecordPolicy.getId().equals(recordPolicyIRI)) {
                throw ErrorUtils.sendError("Policy Id does not match provided record policy",
                        Response.Status.BAD_REQUEST);
            }

            // Policy Policy
            Optional<String> policyPolicyIdOpt = getRelatedResourceId(recordPolicyId, conn);
            String policyPolicyId = policyPolicyIdOpt.orElseThrow(() -> ErrorUtils.sendError("Policy for record "
                    + "policy " + recordId + " does not exist in repository", Response.Status.BAD_REQUEST));
            if (StringUtils.isEmpty(policyPolicyId)) {
                throw ErrorUtils.sendError("Policy for policy " + recordPolicyId + "does not exist in repository",
                        Response.Status.BAD_REQUEST);
            }
            IRI policyPolicyIRI = vf.createIRI(policyPolicyId);
            Optional<XACMLPolicy> policyPolicy = policyManager.getPolicy(policyPolicyIRI);
            if (!policyPolicy.isPresent()) {
                throw ErrorUtils.sendError("Policy policy to update could not be found",
                        Response.Status.BAD_REQUEST);
            }

            XACMLPolicy updatedPolicyPolicy = updatePolicyPolicy(policyJson, policyPolicy.get().getJaxbPolicy());
            if (!updatedPolicyPolicy.getId().equals(vf.createIRI(policyPolicyId))) {
                throw ErrorUtils.sendError("Policy policy Id does not match provided policy",
                        Response.Status.BAD_REQUEST);
            }

            policyManager.updatePolicy(updatedRecordPolicy);
            policyManager.updatePolicy(updatedPolicyPolicy);
            return Response.ok().build();
        } catch (IllegalArgumentException | PolicySyntaxException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, "Policy could not be updated", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets an Optional of the String value of the associated related resource for the provided identifier.
     *
     * @param resourceId The ID of the record or policy
     * @param conn A RepositoryConnection for lookup
     * @return The Optional containing the ID of the related resource
     */
    private Optional<String> getRelatedResourceId(String resourceId, RepositoryConnection conn) {
        RepositoryResult<Statement> results = conn.getStatements(null,
                vf.createIRI(Policy.relatedResource_IRI), vf.createIRI(resourceId));
        if (!results.hasNext()) {
            LOGGER.info("Could not find related resource for: " + resourceId);
            return Optional.empty();
        }
        Optional<String> result = Optional.of(results.next().getSubject().stringValue());
        results.close();
        return result;
    }

    /**
     * Updates the policy policy file with the corresponding 'update' permissions from the record policy.
     *
     * @param json The json from record policy update
     * @param policyType The PolicyType from the policy policy
     * @return The update XACML policy
     */
    private XACMLPolicy updatePolicyPolicy(String json, PolicyType policyType) {
        AttributeDesignatorType subjectIdAttrDesig = createSubjectIdAttrDesig();
        AttributeDesignatorType groupAttrDesig = createGroupAttrDesig();

        JSONObject jsonObject = JSONObject.fromObject(json);
        JSONObject updateObj = jsonObject.optJSONObject("urn:update");
        if (updateObj == null) {
            throw new IllegalArgumentException("Invalid JSON representation of a Policy. Missing update rule.");
        }

        AnyOfType readUserAnyOf = policyType.getRule().get(0).getTarget().getAnyOf().get(1);
        AnyOfType updateUserAnyOf = policyType.getRule().get(1).getTarget().getAnyOf().get(1);
        readUserAnyOf.getAllOf().clear();
        updateUserAnyOf.getAllOf().clear();
        if (updateObj.opt("everyone") == null) {
            throw new IllegalArgumentException("Invalid JSON representation of a Policy. Missing everyone field.");
        }
        if (updateObj.getBoolean("everyone")) {
            MatchType userRoleMatch = createUserRoleMatch();
            AllOfType everyoneAllOf = new AllOfType();
            everyoneAllOf.getMatch().add(userRoleMatch);
            readUserAnyOf.getAllOf().add(everyoneAllOf);
            updateUserAnyOf.getAllOf().add(everyoneAllOf);
        } else {
            JSONArray usersArray = updateObj.optJSONArray("users");
            JSONArray groupsArray = updateObj.optJSONArray("groups");
            if (usersArray == null || groupsArray == null) {
                throw new IllegalArgumentException("Invalid JSON representation of a Policy."
                        + " Users or groups not set properly for update rule");
            }
            addUsersOrGroupsToAnyOf(usersArray, subjectIdAttrDesig, readUserAnyOf, updateUserAnyOf);
            addUsersOrGroupsToAnyOf(groupsArray, groupAttrDesig, readUserAnyOf, updateUserAnyOf);
        }

        return policyManager.createPolicy(policyType);
    }

    /**
     * Converts a record policy abridged JSON into a XACML policy object.
     *
     * @param json The record policy JSON
     * @param policyType the PolicyType from the record policy
     * @return The updated XACMLPolicy object
     */
    private XACMLPolicy recordJsonToPolicy(String json, PolicyType policyType) {
        Optional<String> masterBranch = Optional.empty();

        List<RuleType> policyTypeRules = policyType.getRule();
        for (RuleType ruleType: policyTypeRules) {
            switch (ruleType.getRuleId()) {
                case "urn:modifyMaster":
                    try {
                        masterBranch = Optional.of(ruleType.getTarget().getAnyOf().get(0).getAllOf().get(0).getMatch()
                                .get(1).getAttributeValue().getContent().get(0).toString());
                    } catch (IndexOutOfBoundsException e){
                        LOGGER.error("Policy File is corrupted: master branch target invalid");
                    }
                    break;
                default:
                    break;
            }
        }

        policyType.getRule().clear();

        AttributeDesignatorType actionIdAttrDesig = createActionIdAttrDesig();
        AttributeDesignatorType subjectIdAttrDesig = createSubjectIdAttrDesig();
        AttributeDesignatorType groupAttrDesig = createGroupAttrDesig();
        AttributeDesignatorType branchAttrDesig = createBranchAttrDesig();

        JSONObject jsonObject = JSONObject.fromObject(json);
        Iterator<?> keys = jsonObject.keys();
        // iterate all json keys
        while (keys.hasNext()) {
            String key = (String)keys.next();
            TargetType target = new TargetType();
            RuleType rule = createRule(EffectType.PERMIT, key, target);
            AttributeValueType ruleTypeAttrVal = new AttributeValueType();
            ruleTypeAttrVal.setDataType(XSD.STRING);

            // Setup Rule Type
            MatchType ruleTypeMatch = createMatch(XACML.STRING_EQUALS, actionIdAttrDesig, ruleTypeAttrVal);
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
                    ruleTypeAttrVal.getContent().add(ONTOLOGIES_CATALOG_MODIFY);
                    break;
                case "urn:modifyMaster":
                    ruleTypeAttrVal.getContent().add(ONTOLOGIES_CATALOG_MODIFY);
                    break;
                default:
                    throw new MobiException("Invalid rule key: " + key);
            }

            AnyOfType anyOfType = new AnyOfType();
            AllOfType allOfType = new AllOfType();
            anyOfType.getAllOf().add(allOfType);
            allOfType.getMatch().add(ruleTypeMatch);

            if (key.equalsIgnoreCase("urn:modifyMaster") && masterBranch.isPresent()) {
                AttributeValueType branchAttrVal = createAttributeValue(XSD.STRING, masterBranch.get());
                MatchType branchMatch = createMatch(XACML.STRING_EQUALS, branchAttrDesig, branchAttrVal);
                allOfType.getMatch().add(branchMatch);
            }
            rule.getTarget().getAnyOf().add(anyOfType);

            // Setup Users
            AnyOfType usersGroups = new AnyOfType();
            JSONObject jsonRule = jsonObject.optJSONObject(key);
            if (jsonRule == null) {
                throw new IllegalArgumentException("Invalid JSON representation of a Policy. Missing rule " + key);
            }
            if (jsonRule.opt("everyone") == null) {
                throw new IllegalArgumentException("Invalid JSON representation of a Policy. Missing everyone field"
                        + "for " + key);
            }
            if (jsonRule.getBoolean("everyone")) {
                MatchType userRoleMatch = createUserRoleMatch();
                AllOfType everyoneAllOf = new AllOfType();
                everyoneAllOf.getMatch().add(userRoleMatch);
                usersGroups.getAllOf().add(everyoneAllOf);
            } else {
                JSONArray usersArray = jsonRule.optJSONArray("users");
                JSONArray groupsArray = jsonRule.optJSONArray("groups");
                if (usersArray == null || groupsArray == null) {
                    throw new IllegalArgumentException("Invalid JSON representation of a Policy."
                            + " Users or groups not set properly for " + key);
                }
                if (usersArray.size() == 0 && groupsArray.size() == 0){
                    throw new IllegalArgumentException("Need to have at least one user or group since everybody is false");
                }
                addUsersOrGroupsToAnyOf(usersArray, subjectIdAttrDesig, usersGroups);
                addUsersOrGroupsToAnyOf(groupsArray, groupAttrDesig, usersGroups);
            }
            rule.getTarget().getAnyOf().add(usersGroups);

            if (key.equalsIgnoreCase("urn:modify") && masterBranch.isPresent()) {
                ConditionType condition = new ConditionType();
                condition.setExpression(createMasterBranchExpression(masterBranch.get()));
                rule.setCondition(condition);
            }
            policyType.getRule().add(rule);
        }
        return policyManager.createPolicy(policyType);
    }

    /**
     * Iterates over the JSONArray of users or groups and adds an AllOf with a single Match to the provided AnyOf.
     *
     * @param array The JSONArray of users or groups to iterate over
     * @param attributeDesignator the AttributeDesignatorType to apply to the MatchType
     * @param anyOfArray the AnyOfType to add the AllOf statement to
     */
    private void addUsersOrGroupsToAnyOf(JSONArray array, AttributeDesignatorType attributeDesignator,
                                         AnyOfType... anyOfArray) {
        for (int i = 0; i < array.size(); i++) {
            String value = array.optString(i);
            if (StringUtils.isEmpty(value)) {
                throw new IllegalArgumentException("Invalid JSON representation of a Policy."
                        + " User or group not set properly.");
            }
            AttributeValueType userAttrVal = createAttributeValue(XSD.STRING, value);

            MatchType userMatch = createMatch(XACML.STRING_EQUALS, attributeDesignator, userAttrVal);
            AllOfType userAllOf = new AllOfType();
            userAllOf.getMatch().add(userMatch);
            for (AnyOfType anyOf : anyOfArray) {
                anyOf.getAllOf().add(userAllOf);
            }
        }
    }

    /**
     * Creates the JAXBElement representing the master branch condition statement.
     *
     * @param masterBranch the String representation of the master branch
     * @return JAXBElement representing the master branch condition statement
     */
    private JAXBElement<?> createMasterBranchExpression(String masterBranch) {
        // Innermost expression list
        FunctionType strEqFunctionType = new FunctionType();
        strEqFunctionType.setFunctionId(XACML.STRING_EQUALS);

        JAXBElement<AttributeValueType> branchValue = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "AttributeValue"),
                AttributeValueType.class, createAttributeValue(XSD.STRING, masterBranch));
        JAXBElement<AttributeDesignatorType> branchDesignator = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "AttributeDesignator"),
                AttributeDesignatorType.class, createBranchAttrDesig());
        JAXBElement<FunctionType> stringEqual = new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Function"),
                FunctionType.class, strEqFunctionType);
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
        return new JAXBElement<>(
                new QName("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Apply"),
                ApplyType.class, branchNotApply);
    }

    /**
     * Converts a XACMLPolicy object of a record policy to an abridged JSON format of users who can perform each rule.
     * {
     *   "urn:read": {
     *     "everyone": false,
     *     "users": [
     *       "http://mobi.com/users/userIRI1",
     *       "http://mobi.com/users/userIRI2"
     *     ],
     *     "groups": []
     *   }, ...
     * }
     *
     * @param policy the XACMLPolicy to convert to JSON
     * @return the String representation of the JSON
     */
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

    private RuleType createRule(EffectType effect, String ruleId, TargetType target) {
        RuleType rule = new RuleType();
        rule.setEffect(effect);
        rule.setRuleId(ruleId);
        rule.setTarget(target);
        return rule;
    }

    private MatchType createMatch(String matchId, AttributeDesignatorType attributeDesignator,
                                  AttributeValueType attributeValue) {
        MatchType match = new MatchType();
        match.setMatchId(matchId);
        match.setAttributeDesignator(attributeDesignator);
        match.setAttributeValue(attributeValue);
        return match;
    }

    private MatchType createUserRoleMatch() {
        return createMatch(XACML.STRING_EQUALS, createUserAttrDesig(), createUserAttrVal());
    }

    private AttributeDesignatorType createAttributeDesignator(String attributeId, String category, String dataType,
                                                              boolean mustBePresent) {
        AttributeDesignatorType attrDesig = new AttributeDesignatorType();
        attrDesig.setAttributeId(attributeId);
        attrDesig.setCategory(category);
        attrDesig.setDataType(dataType);
        attrDesig.setMustBePresent(mustBePresent);
        return attrDesig;
    }

    private AttributeValueType createAttributeValue(String dataType, String content) {
        AttributeValueType attrVal = new AttributeValueType();
        attrVal.setDataType(dataType);
        attrVal.getContent().add(content);
        return attrVal;
    }

    private AttributeDesignatorType createSubjectIdAttrDesig() {
        return createAttributeDesignator(XACML.SUBJECT_ID, XACML.SUBJECT_CATEGORY, XSD.STRING, true);
    }

    private AttributeDesignatorType createActionIdAttrDesig() {
        return createAttributeDesignator(XACML.ACTION_ID, XACML.ACTION_CATEGORY, XSD.STRING, true);
    }

    private AttributeDesignatorType createGroupAttrDesig() {
        return createAttributeDesignator(
                "http://mobi.com/policy/prop-path(%5E%3Chttp%3A%2F%2Fxmlns.com%2Ffoaf%2F0.1%2Fmember%3E)",
                XACML.SUBJECT_CATEGORY, XSD.STRING, true);
    }

    private AttributeDesignatorType createBranchAttrDesig() {
        return createAttributeDesignator("http://mobi.com/ontologies/catalog#branch", XACML.ACTION_CATEGORY,
                XSD.STRING, false);
    }

    private AttributeDesignatorType createUserAttrDesig() {
        return createAttributeDesignator(User.hasUserRole_IRI,  XACML.SUBJECT_CATEGORY, XSD.STRING, true);
    }

    private AttributeValueType createUserAttrVal() {
        return createAttributeValue(XSD.STRING, "http://mobi.com/roles/user");
    }
}
