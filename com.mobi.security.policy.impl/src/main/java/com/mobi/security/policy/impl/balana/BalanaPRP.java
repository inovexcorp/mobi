package com.mobi.security.policy.impl.balana;

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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.security.policy.api.PRP;
import com.mobi.security.policy.api.ontologies.policy.PolicyFactory;
import org.w3c.dom.Document;
import org.wso2.balana.AbstractPolicy;
import org.wso2.balana.MatchResult;
import org.wso2.balana.ParsingException;
import org.wso2.balana.PolicySet;
import org.wso2.balana.combine.PolicyCombiningAlgorithm;
import org.wso2.balana.combine.xacml2.FirstApplicablePolicyAlg;
import org.wso2.balana.ctx.EvaluationCtx;
import org.wso2.balana.finder.PolicyFinder;
import org.wso2.balana.finder.PolicyFinderModule;
import org.wso2.balana.finder.PolicyFinderResult;
import org.xml.sax.SAXException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

@Component
public class BalanaPRP extends PolicyFinderModule implements PRP {
    private Map<Resource, AbstractPolicy> policies = new HashMap<>();
    private PolicyCombiningAlgorithm combiningAlg;

    private Repository repo;
    private ValueFactory vf;
    private ModelFactory mf;
    private PolicyFactory policyFactory;

    @Reference
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
    void setPolicyFactory(PolicyFactory policyFactory) {
        this.policyFactory = policyFactory;
    }

    @Override
    public void init(PolicyFinder policyFinder) {
        loadPolicies();
        combiningAlg = new FirstApplicablePolicyAlg();
    }

    @Override
    public boolean isRequestSupported() {
        return true;
    }

    @Override
    public Set<Document> findPolicy(Document request) {
        return null;
    }

    @Override
    public PolicyFinderResult findPolicy(EvaluationCtx context) {
        ArrayList<AbstractPolicy> selectedPolicies = new ArrayList<>();
        Set<Map.Entry<Resource, AbstractPolicy>> entrySet = policies.entrySet();

        // iterate through all the policies we currently have loaded
        for (Map.Entry<Resource, AbstractPolicy> entry : entrySet) {

            AbstractPolicy policy = entry.getValue();
            MatchResult match = policy.match(context);
            int result = match.getResult();

            // if target matching was indeterminate, then return the error
            if (result == MatchResult.INDETERMINATE) {
                return new PolicyFinderResult(match.getStatus());
            }

            // see if the target matched
            if (result == MatchResult.MATCH) {

                // this is the first match we've found, so remember it
                selectedPolicies.add(policy);
            }
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

    private void loadPolicies() {
        policies.clear();
        String policy = "<Policy xmlns=\"urn:oasis:names:tc:xacml:3.0:core:schema:wd-17\" PolicyId=\"http://mobi.com/policies/policy1\" RuleCombiningAlgId=\"urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:deny-unless-permit\" Version=\"1.0\">\n" +
                "    <Description>Who can create an OntologyRecord in the Local Catalog?</Description>\n" +
                "    <Target>\n" +
                "        <AnyOf>\n" +
                "            <AllOf>\n" +
                "                <Match MatchId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\">\n" +
                "                    <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">http://mobi.com/catalogs/local-catalog</AttributeValue>\n" +
                "                    <AttributeDesignator AttributeId=\"urn:oasis:names:tc:xacml:1.0:resource:resource-id\" Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:resource\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\"/>\n" +
                "                </Match>\n" +
                "            </AllOf>\n" +
                "        </AnyOf>\n" +
                "    </Target>\n" +
                "    <Rule Effect=\"Permit\" RuleId=\"urn:rule1\">\n" +
                "        <Description>UserX can create an OntologyRecord in the Local Catalog</Description>\n" +
                "        <Condition>\n" +
                "            <Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:and\">\n" +
                "                <Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:any-of\">\n" +
                "                    <Function FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\"/>\n" +
                "                    <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">create</AttributeValue>\n" +
                "                    <AttributeDesignator AttributeId=\"urn:oasis:names:tc:xacml:1.0:action:action-id\" Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:action\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\"/>\n" +
                "                </Apply>\n" +
                "                <Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:any-of\">\n" +
                "                    <Function FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\"/>\n" +
                "                    <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">http://mobi.com/ontologies/ontology-editor#OntologyRecord</AttributeValue>\n" +
                "                    <AttributeDesignator AttributeId=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\" Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:action\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\"/>\n" +
                "                </Apply>\n" +
                "                <Apply FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:any-of\">\n" +
                "                    <Function FunctionId=\"urn:oasis:names:tc:xacml:1.0:function:string-equal\"/>\n" +
                "                    <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">http://mobi.com/roles/admin</AttributeValue>\n" +
                "                    <AttributeDesignator AttributeId=\"http://mobi.com/ontologies/user/management#hasUserRole\" Category=\"urn:oasis:names:tc:xacml:1.0:subject-category:access-subject\" DataType=\"http://www.w3.org/2001/XMLSchema#string\" MustBePresent=\"true\"/>\n" +
                "                </Apply>\n" +
                "            </Apply>\n" +
                "        </Condition>\n" +
                "    </Rule>\n" +
                "    <Rule Effect=\"Deny\" RuleId=\"urn:denyRule\" />\n" +
                "</Policy>";
        InputStream stream = null;
        try {
            stream = new ByteArrayInputStream(policy.getBytes());
            DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
            docFactory.setNamespaceAware(true);
            Document doc = docFactory.newDocumentBuilder().parse(stream);
            policies.put(vf.createIRI("http://mobi.com/policies/policy1"), org.wso2.balana.Policy.getInstance(doc.getDocumentElement()));
        } catch (SAXException | IOException | ParserConfigurationException | ParsingException e) {
            e.printStackTrace();
        } finally {
            if (stream != null) {
                try {
                    stream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

        /*try (RepositoryConnection conn = repo.getConnection()) {
            conn.getStatements(null, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                    vf.createLiteral(Policy.TYPE)).forEach(statement -> {
                        Resource policyIRI = statement.getSubject();
                        if (!policies.keySet().contains(policyIRI)) {
                            Model policyModel = asModel(conn.getStatements(null, null, null, policyIRI), mf);
                            Policy policy = policyFactory.getExisting(policyIRI, policyModel).orElseThrow(() ->
                                    new IllegalStateException("Could not create Policy"));
                            policies.put(policyIRI, transform(policy));
                        }
                    });*/
        }
    }


}
