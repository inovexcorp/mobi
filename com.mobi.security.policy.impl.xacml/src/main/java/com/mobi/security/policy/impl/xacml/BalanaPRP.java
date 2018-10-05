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
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.security.policy.api.PRP;
import com.mobi.security.policy.api.Policy;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.cache.PolicyCache;
import com.mobi.security.policy.api.exception.PolicySyntaxException;
import com.mobi.security.policy.api.exception.ProcessingException;
import com.mobi.security.policy.api.xacml.PolicyQueryParams;
import com.mobi.security.policy.api.xacml.XACML;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.vocabularies.xsd.XSD;
import org.apache.commons.io.IOUtils;
import org.wso2.balana.AbstractPolicy;
import org.wso2.balana.MatchResult;
import org.wso2.balana.PDPConfig;
import org.wso2.balana.ParsingException;
import org.wso2.balana.PolicySet;
import org.wso2.balana.attr.BagAttribute;
import org.wso2.balana.attr.StringAttribute;
import org.wso2.balana.combine.PolicyCombiningAlgorithm;
import org.wso2.balana.cond.EvaluationResult;
import org.wso2.balana.ctx.AbstractRequestCtx;
import org.wso2.balana.ctx.EvaluationCtx;
import org.wso2.balana.ctx.EvaluationCtxFactory;
import org.wso2.balana.ctx.RequestCtxFactory;
import org.wso2.balana.ctx.Status;
import org.wso2.balana.finder.PolicyFinder;
import org.wso2.balana.finder.PolicyFinderModule;
import org.wso2.balana.finder.PolicyFinderResult;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import javax.cache.Cache;

@Component(immediate = true, provide = {PRP.class, BalanaPRP.class})
public class BalanaPRP extends PolicyFinderModule implements PRP<BalanaPolicy> {
    private PolicyCombiningAlgorithm combiningAlg;
    private PDPConfig config;

    private PolicyCache policyCache;
    private Repository repository;
    private VirtualFilesystem vfs;
    private ValueFactory vf;

    @Reference
    void setPolicyCache(PolicyCache policyCache) {
        this.policyCache = policyCache;
    }

    @Reference(name = "repository")
    void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    void setVfs(VirtualFilesystem vfs) {
        this.vfs = vfs;
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
            return findMatchingPolicies(context);
        } catch (ParsingException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public PolicyFinderResult findPolicy(EvaluationCtx context) {
        List<AbstractPolicy> selectedPolicies;
        try {
            selectedPolicies = findMatchingPolicies(context).stream()
                    .map(BalanaPolicy::getAbstractPolicy)
                    .collect(Collectors.toList());
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

    private List<BalanaPolicy> findMatchingPolicies(EvaluationCtx context) {
        // iterate through all the policies we currently have loaded
        Optional<Cache<String, Policy>> cache = policyCache.getPolicyCache();
        if (cache.isPresent()) {
            EvaluationResult relatedResourceResult;
            try {
                 relatedResourceResult = context.getAttribute(new URI(XSD.STRING),
                        new URI(XACML.RESOURCE_ID),null, new URI(XACML.RESOURCE_CATEGORY));
            } catch (URISyntaxException e) {
                throw new MobiException("Invalid URIs in policy.", e);
            }
            BagAttribute relatedResourceBag = (BagAttribute) relatedResourceResult.getAttributeValue();
            String relatedResource = ((StringAttribute) relatedResourceBag.iterator().next()).getValue();

            PolicyQueryParams queryParams = new PolicyQueryParams.Builder()
                    .addResourceIRI(vf.createIRI(relatedResource))
                    .build();
            List<Resource> policyIds = PolicyUtils.findPolicies(queryParams, repository);
            policyIds.forEach(policyId -> {
                if (!cache.get().containsKey(policyId.stringValue())) {
                    try (RepositoryConnection conn = repository.getConnection()) {
                        RepositoryResult<Statement> statements = conn.getStatements(policyId,
                                vf.createIRI(BinaryFile.retrievalURL_IRI), null);
                        VirtualFile file = vfs.resolveVirtualFile(statements.iterator().next().getObject()
                                .stringValue());
                        String policyStr = IOUtils.toString(file.readContent(), "UTF-8");
                        cache.get().put(policyId.stringValue(), new BalanaPolicy(policyStr, vf));
                    } catch (IOException e) {
                        throw new MobiException("Error retrieving policy from VFS.", e);
                    }
                }
            });
            return StreamSupport.stream(cache.get().spliterator(), false)
                    .map(Cache.Entry::getValue)
                    .filter(policy -> policy instanceof XACMLPolicy)
                    .map(policy -> (XACMLPolicy) policy)
                    .map(policy -> {
                        if (policy instanceof BalanaPolicy) {
                            return (BalanaPolicy) policy;
                        } else {
                            return new BalanaPolicy(policy.getJaxbPolicy(), vf);
                        }
                    })
                    .filter(policy -> {
                        MatchResult match = policy.getAbstractPolicy().match(context);
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
                        return result == MatchResult.MATCH;
                    })
                    .collect(Collectors.toList());
        }

        return Collections.emptyList();
    }
}
