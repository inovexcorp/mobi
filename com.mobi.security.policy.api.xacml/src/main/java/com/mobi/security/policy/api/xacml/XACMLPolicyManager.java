package com.mobi.security.policy.api.xacml;

/*-
 * #%L
 * com.mobi.security.policy.api.xacml
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.repository.api.OsgiRepository;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import org.eclipse.rdf4j.model.Resource;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface XACMLPolicyManager {

    /**
     * Returns the Repository which should store all policy data.
     *
     * @return The policy Repository
     */
    OsgiRepository getRepository();

    /**
     * Creates an {@link XACMLPolicy} object using the provided {@link PolicyType} JAXB object.
     *
     * @param policyType A JAXB object with an XACML policy
     * @return An {@link XACMLPolicy} representing the policy from the {@link PolicyType}
     */
    XACMLPolicy createPolicy(PolicyType policyType);

    /**
     * Adds the provided XACMLPolicy to Mobi and returns its {@link Resource} identifier which will be the same as
     * the provided {@link XACMLPolicy#id}.
     *
     * @param policy The XACMLPolicy whose contents will be stored in the system.
     * @return A Resource identifier
     * @throws IllegalArgumentException If the Policy ID already exists in the repository
     * @throws IllegalStateException If an error occurred preventing the policy being saved that the system could
     *      not prevent
     */
    Resource addPolicy(XACMLPolicy policy);

    /**
     * Returns a list of all the {@link XACMLPolicy XACMLPolicies} stored in Mobi that match the provided
     * query parameters.
     *
     * @param params Any related resources, subjects, or actions to filter the policies by
     * @return A {@link List} of {@link XACMLPolicy XACMLPolicies} that are stored in Mobi
     */
    List<XACMLPolicy> getPolicies(PolicyQueryParams params);

    /**
     * Retrieves a {@link XACMLPolicy} by its {@link Resource} identifier if found.
     *
     * @param policyId A Resource identifying a policy
     * @return The identified {@link XACMLPolicy} if found; otherwise an {@link Optional#empty()}
     * @throws IllegalStateException If an error occurred retrieving the policy that the system could not prevent
     */
    Optional<XACMLPolicy> getPolicy(Resource policyId);

    /**
     * Updates the policy identified by the id within the provided new {@link XACMLPolicy} by replacing its contents.
     *
     * @param newPolicy The new policy to replace the identified one with
     * @throws IllegalArgumentException If the policy does not exist
     * @throws IllegalStateException If an error occurred preventing the policy being retrieved or saved that the
     *      system could not prevent
     */
    void updatePolicy(XACMLPolicy newPolicy);

    /**
     * Removes the policy identified with the provided {@link Resource} identifier from Mobi.
     *
     * @param policyId A {@link Resource} identifying a policy
     * @throws IllegalStateException If an error occurred preventing the policy being removed that the system could
     *      not prevent
     */
    void deletePolicy(Resource policyId);

    /**
     * Returns a set of the {@link Resource}s for all the system {@link XACMLPolicy XACMLPolicies} stored in Mobi.
     *
     * @return A {@link Set} of the {@link Resource}s for all the system {@link XACMLPolicy XACMLPolicies} stored in
     *     Mobi.
     */
    Set<Resource> getSystemPolicyIds();

    /**
     * Adds the provided {@link XACMLPolicy} to Mobi, marks it as a system policy, and returns its {@link Resource}
     * identifier which will be the same as the provided {@link XACMLPolicy#id}.
     *
     * @param policy The {@link XACMLPolicy} to use as a system policy.
     * @return The {@link Resource} identifier of the {@link XACMLPolicy}.
     * @throws IllegalArgumentException If the Policy ID already exists in the repository.
     * @throws IllegalStateException If an error occurred preventing the policy being saved that the system could
     *      not prevent.
     */
    Resource addSystemPolicy(XACMLPolicy policy);

    /**
     * Converts the provided string into a {@link XACMLPolicy} and loads it into the system if a policy with the same id
     * does not already exist.
     *
     * @param policy The {@link String} representation of a policy.
     * @return The {@link Resource} of the provided policy.
     */
    Resource loadPolicyIfAbsent(String policy);

    /**
     * Converts the provided string into a {@link XACMLPolicy} and loads it into the system as a system policy if a
     * system policy with the same id does not already exist.
     *
     * @param policy The {@link String} representation of a policy.
     * @return The {@link Resource} of the provided policy.
     */
    Resource loadSystemPolicyIfAbsent(String policy);

    /**
     * @return the base directory for where Policies are stored
     */
    String getFileLocation();
}
