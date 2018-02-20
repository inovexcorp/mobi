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

import static com.mobi.persistence.utils.RepositoryResults.asModel;
import static com.mobi.security.policy.impl.xacml.XACML.PROCESSING_ERROR;
import static com.mobi.security.policy.impl.xacml.XACML.SYNTAX_ERROR;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.security.policy.api.PRP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.exception.PolicySyntaxException;
import com.mobi.security.policy.api.exception.ProcessingException;
import com.mobi.security.policy.api.ontologies.policy.PolicyFile;
import com.mobi.security.policy.api.ontologies.policy.PolicyFileFactory;
import org.apache.commons.vfs2.FileObject;
import org.apache.commons.vfs2.FileSystemManager;
import org.apache.commons.vfs2.VFS;
import org.w3c.dom.Document;
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
import org.xml.sax.SAXException;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

@Component(immediate = true, provide = {PRP.class, BalanaPRP.class})
public class BalanaPRP extends PolicyFinderModule implements PRP<XACMLPolicy> {
    private PolicyCombiningAlgorithm combiningAlg;
    private PDPConfig config;

    private Repository repo;
    private ValueFactory vf;
    private ModelFactory mf;
    private PolicyFileFactory policyFileFactory;

    @Reference(target = "(id=system)")
    void setRepo(Repository repo) {
        this.repo = repo;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setPolicyFileFactory(PolicyFileFactory policyFileFactory) {
        this.policyFileFactory = policyFileFactory;
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
    public List<XACMLPolicy> findPolicies(Request request) throws ProcessingException, PolicySyntaxException {
        try {
            AbstractRequestCtx requestCtx = RequestCtxFactory.getFactory().getRequestCtx(request.toString());
            EvaluationCtx context = EvaluationCtxFactory.getFactory().getEvaluationCtx(requestCtx, config);
            return findPolicies(context).stream()
                    .map(abstractPolicy -> new XACMLPolicy(abstractPolicy, vf))
                    .collect(Collectors.toList());
        } catch (ParsingException e) {
            throw new ProcessingException(e);
        }
    }

    private List<AbstractPolicy> findPolicies(EvaluationCtx context) {
        ArrayList<AbstractPolicy> selectedPolicies = new ArrayList<>();
        Set<Map.Entry<Resource, AbstractPolicy>> entrySet = loadPolicies().entrySet();

        // iterate through all the policies we currently have loaded
        for (Map.Entry<Resource, AbstractPolicy> entry : entrySet) {

            AbstractPolicy policy = entry.getValue();
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
        }
        return selectedPolicies;
    }

    @Override
    public PolicyFinderResult findPolicy(EvaluationCtx context) {
        List<AbstractPolicy> selectedPolicies;
        try {
            selectedPolicies = findPolicies(context);
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
                return new PolicyFinderResult((selectedPolicies.get(0)));
            default:
                return new PolicyFinderResult(new PolicySet(null, combiningAlg, null, selectedPolicies));
        }
    }

    private Map<Resource, AbstractPolicy> loadPolicies() {
        Map<Resource, AbstractPolicy> policies = new HashMap<>();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.getStatements(null, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                    vf.createIRI(PolicyFile.TYPE)).forEach(statement -> {
                        Resource policyIRI = statement.getSubject();
                        Model policyModel = asModel(conn.getStatements(null, null, null, policyIRI), mf);
                        PolicyFile policyFile = policyFileFactory.getExisting(policyIRI, policyModel).orElseThrow(() ->
                                new ProcessingException("Could not create Policy"));
                        AbstractPolicy policy = transform(policyFile);
                        policies.put(vf.createIRI(policy.getId().toString()), policy);
                    });
        }
        return policies;
    }

    private AbstractPolicy transform(PolicyFile policy) {
        try {
            FileSystemManager manager = VFS.getManager();
            FileObject fileObject = manager.resolveFile(policy.getResource().stringValue());
            if (fileObject.isFile()) {
                try (InputStream stream = fileObject.getContent().getInputStream()) {
                    DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
                    docFactory.setNamespaceAware(true);
                    Document doc = docFactory.newDocumentBuilder().parse(stream);
                    return org.wso2.balana.Policy.getInstance(doc.getDocumentElement());
                }
            } else {
                throw new ProcessingException("Could not retrieve Policy");
            }
        } catch (SAXException | ParsingException e) {
            throw new PolicySyntaxException("Error parsing Policy");
        } catch (ParserConfigurationException | IOException e) {
            throw new ProcessingException("Error retrieving Policy");
        }
    }
}
