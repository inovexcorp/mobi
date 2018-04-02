package com.mobi.security.policy.api.xacml;

/*-
 * #%L
 * com.mobi.security.policy.api.xacml
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

import com.mobi.rdf.api.Resource;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;

import java.util.List;
import java.util.Optional;

public interface XACMLPolicyManager {

    /**
     * Creates an {@link XACMLPolicy} object using the provided {@link PolicyType} JAXB object.
     *
     * @param policyType A JAXB object with an XACML policy
     * @return An {@link XACMLPolicy} representing the policy from the {@link PolicyType}
     */
    XACMLPolicy createPolicy(PolicyType policyType);

    /**
     * Adds the provided XACMLPolicy to Mobi and returns its {@link Resource} identifier.
     *
     * @param policy The XACMLPolicy whose contents will be stored in the system.
     * @return A Resource identifier
     * @throws IllegalStateException If an error occurred preventing the policy being saved that the system could
     *      not prevent
     */
    Resource addPolicy(XACMLPolicy policy);

    /**
     * Returns a list of all the {@link XACMLPolicy XACMLPolicies} stored in Mobi.
     *
     * @return A {@link List} of {@link XACMLPolicy XACMLPolicies} that are stored in Mobi
     */
    List<XACMLPolicy> getPolicies();

    /**
     * Retrieves a {@link XACMLPolicy} by its {@link Resource} identifier if found.
     *
     * @param policyId A Resource identifying a policy
     * @return The identified {@link XACMLPolicy} if found; otherwise an {@link Optional#empty()}
     * @throws IllegalArgumentException If the policy does not exist
     * @throws IllegalStateException If an error occurred retrieving the policy that the system could not prevent
     */
    Optional<XACMLPolicy> getPolicy(Resource policyId);

    /**
     * Updates the policy identified by the provided {@link Resource} identifier by replacing its contents with the
     * provided new {@link XACMLPolicy).
     *
     * @param policyId A {@link Resource} identifying a policy
     * @param newPolicy The new policy to replace the identified one with
     * @throws IllegalArgumentException If the policy does not exist
     * @throws IllegalStateException If an error occurred preventing the policy being retrieved or saved that the
     *      system could not prevent
     */
    void updatePolicy(Resource policyId, XACMLPolicy newPolicy);

    /**
     * Removes the identified policy from Mobi.
     *
     * @param policyId A {@link Resource} identifying a policy
     * @throws IllegalStateException If an error occurred preventing the policy being removed that the system could
     *      not prevent
     */
    void deletePolicy(Resource policyId);
}
