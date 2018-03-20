package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * com.mobi.security.policy.api
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

import static com.mobi.security.policy.api.xacml.XACML.PROCESSING_ERROR;
import static com.mobi.security.policy.api.xacml.XACML.SYNTAX_ERROR;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.exception.MobiException;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.PRP;
import com.mobi.security.policy.api.Policy;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.cache.PolicyCache;
import com.mobi.security.policy.api.exception.PolicySyntaxException;
import com.mobi.security.policy.api.exception.ProcessingException;
import org.wso2.balana.AbstractPolicy;
import org.wso2.balana.MatchResult;
import org.wso2.balana.PDPConfig;
import org.wso2.balana.ParsingException;
import org.wso2.balana.PolicySet;
import org.wso2.balana.combine.PolicyCombiningAlgorithm;
import org.wso2.balana.ctx.AbstractRequestCtx;
import org.wso2.balana.ctx.EvaluationCtx;
import org.wso2.balana.ctx.EvaluationCtxFactory;
import org.wso2.balana.ctx.RequestCtxFactory;
import org.wso2.balana.ctx.Status;
import org.wso2.balana.finder.PolicyFinder;
import org.wso2.balana.finder.PolicyFinderModule;
import org.wso2.balana.finder.PolicyFinderResult;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.cache.Cache;

@Component(immediate = true, provide = {PRP.class, BalanaPRP.class})
public class BalanaPRP extends PolicyFinderModule implements PRP<BalanaPolicy> {
    private PolicyCombiningAlgorithm combiningAlg;
    private PDPConfig config;

    private PolicyCache policyCache;
    private ValueFactory vf;

    @Reference
    void setPolicyCache(PolicyCache policyCache) {
        this.policyCache = policyCache;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Override
    public void init(PolicyFinder policyFinder) {
    }

    public void setCombiningAlg(PolicyCombiningAlgorithm policyAlgorithm) {
        combiningAlg = policyAlgorithm;
    }

    public void setPDPConfig(PDPConfig config) {
        this.config = config;
    }

    @Override
    public boolean isRequestSupported() {
        return true;
    }

    @Override
    public List<BalanaPolicy> findPolicies(Request request) throws ProcessingException, PolicySyntaxException {
        try {
            AbstractRequestCtx requestCtx = RequestCtxFactory.getFactory().getRequestCtx(request.toString());
            EvaluationCtx context = EvaluationCtxFactory.getFactory().getEvaluationCtx(requestCtx, config);
            return findPolicyList(context).stream()
                    .map(abstractPolicy -> new BalanaPolicy(abstractPolicy, vf))
                    .collect(Collectors.toList());
        } catch (ParsingException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public PolicyFinderResult findPolicy(EvaluationCtx context) {
        List<AbstractPolicy> selectedPolicies;
        try {
            selectedPolicies = findPolicyList(context);
        } catch (PolicySyntaxException e) {
            return new PolicyFinderResult(new Status(Collections.singletonList(SYNTAX_ERROR), e.getMessage()));
        } catch (ProcessingException e) {
            return new PolicyFinderResult(new Status(Collections.singletonList(PROCESSING_ERROR),
                    e.getMessage()));
        }

        // no errors happened during the search, so now take the right
        // action based on how many policies we found
        switch (selectedPolicies.size()) {
            case 0:
                return new PolicyFinderResult();
            case 1:
                return new PolicyFinderResult(selectedPolicies.get(0));
            default:
                return new PolicyFinderResult(new PolicySet(null, combiningAlg, null, selectedPolicies));
        }
    }

    private List<AbstractPolicy> findPolicyList(EvaluationCtx context) {
        ArrayList<AbstractPolicy> selectedPolicies = new ArrayList<>();
        // iterate through all the policies we currently have loaded
        loadPolicies().forEach(policy -> {
            MatchResult match = policy.match(context);
            int result = match.getResult();

            // if target matching was indeterminate, then return the error
            if (result == MatchResult.INDETERMINATE) {
                Status status = match.getStatus();
                if (status.getCode().contains(SYNTAX_ERROR)) {
                    throw new PolicySyntaxException(status.getMessage());
                }
                if (status.getCode().contains(PROCESSING_ERROR)) {
                    throw new ProcessingException(status.getMessage());
                }
            }

            // see if the target matched
            if (result == MatchResult.MATCH) {

                // this is the first match we've found, so remember it
                selectedPolicies.add(policy);
            }
        });

        return selectedPolicies;
    }

    private List<AbstractPolicy> loadPolicies() {
        List<AbstractPolicy> policies = new ArrayList<>();
        Optional<Cache<String, Policy>> cache = policyCache.getPolicyCache();
        cache.ifPresent(entries -> {
            for (Cache.Entry<String, Policy> entry : entries) {
                Policy policy = entry.getValue();
                if (policy instanceof BalanaPolicy) {
                    policies.add(((BalanaPolicy) policy).getAbstractPolicy());
                }
            }
        });

        return policies;
    }
}
