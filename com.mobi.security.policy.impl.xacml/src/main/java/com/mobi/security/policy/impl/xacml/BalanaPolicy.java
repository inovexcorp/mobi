package com.mobi.security.policy.impl.xacml;

/*-
 * #%L
 * com.mobi.security.policy.impl.xacml
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

import com.mobi.rdf.api.ValueFactory;
import com.mobi.security.policy.api.exception.PolicySyntaxException;
import com.mobi.security.policy.api.exception.ProcessingException;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import org.w3c.dom.Document;
import org.wso2.balana.AbstractPolicy;
import org.wso2.balana.ParsingException;
import org.xml.sax.SAXException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.io.StringWriter;
import javax.xml.bind.JAXB;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

public class BalanaPolicy extends XACMLPolicy {

    private AbstractPolicy abstractPolicy;

    public BalanaPolicy(PolicyType policyType, ValueFactory vf) {
        super(policyType, vf);
        StringWriter sw = new StringWriter();
        JAXB.marshal(of.createPolicy(policyType), sw);
        this.abstractPolicy = stringToPolicy(sw.toString());
    }

    public BalanaPolicy(String policyStr, ValueFactory vf) {
        super(policyStr, vf);
        this.abstractPolicy = stringToPolicy(policyStr);
    }

    public BalanaPolicy(AbstractPolicy abstractPolicy, ValueFactory vf) {
        this.abstractPolicy = abstractPolicy;
        this.id = vf.createIRI(this.abstractPolicy.getId().toString());
        this.description = this.abstractPolicy.getDescription();
        this.policyType = JAXB.unmarshal(new StringReader(abstractPolicy.encode()), PolicyType.class);
    }

    protected AbstractPolicy getAbstractPolicy() {
        return abstractPolicy;
    }

    private AbstractPolicy stringToPolicy(String policyStr) {
        try (InputStream stream = new ByteArrayInputStream(policyStr.getBytes())) {
            DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
            docFactory.setNamespaceAware(true);
            Document doc = docFactory.newDocumentBuilder().parse(stream);
            return org.wso2.balana.Policy.getInstance(doc.getDocumentElement());
        } catch (SAXException | ParsingException e) {
            throw new PolicySyntaxException("Error parsing Policy");
        } catch (ParserConfigurationException | IOException e) {
            throw new ProcessingException("Error retrieving Policy");
        }
    }
}
