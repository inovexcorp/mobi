package com.mobi.security.policy.impl.balana;

/*-
 * #%L
 * security.policy.impl
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.exception.MobiException;
import com.mobi.security.policy.api.PDP;
import org.w3c.dom.Document;
import org.wso2.balana.Balana;
import org.wso2.balana.PDPConfig;
import org.wso2.balana.finder.AttributeFinder;
import org.wso2.balana.finder.AttributeFinderModule;
import org.wso2.balana.finder.PolicyFinder;
import org.wso2.balana.finder.PolicyFinderModule;
import org.xml.sax.SAXException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

@Component
public class BalanaPDP implements PDP {

    private BalanaPIP balanaPIP;
    private BalanaPRP balanaPRP;

    private Balana balana;

    @Activate
    public void setUp() {
        balana = Balana.getInstance();
    }

    @Reference
    void setBalanaPIP(BalanaPIP balanaPIP) {
        this.balanaPIP = balanaPIP;
    }

    @Reference
    void setBalanaPRP(BalanaPRP balanaPRP) {
        this.balanaPRP = balanaPRP;
    }

    @Override
    public Document evaluate(Document request) {
        org.wso2.balana.PDP pdp = getPDP();
        String result = pdp.evaluate(documentToString(request));

        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        try {
            return dbf.newDocumentBuilder().parse(new ByteArrayInputStream(result.getBytes()));
        } catch (SAXException | IOException | ParserConfigurationException e) {
            throw new MobiException(e);
        }
    }

    private org.wso2.balana.PDP getPDP() {
        PDPConfig config = balana.getPdpConfig();

        PolicyFinder policyFinder = config.getPolicyFinder();
        Set<PolicyFinderModule> policyFinderModules = new HashSet<>();
        policyFinderModules.add(balanaPRP);
        policyFinder.setModules(policyFinderModules);

        AttributeFinder attributeFinder = config.getAttributeFinder();
        List<AttributeFinderModule> attributeFinderModules = attributeFinder.getModules();
        attributeFinderModules.add(balanaPIP);
        attributeFinder.setModules(attributeFinderModules);

        return new org.wso2.balana.PDP(new PDPConfig(attributeFinder, policyFinder, null, false));
    }

    private String documentToString(Document doc) {
        try {
            TransformerFactory tf = TransformerFactory.newInstance();
            Transformer transformer = tf.newTransformer();
            transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(doc), new StreamResult(writer));
            return writer.toString();
        } catch (TransformerException e) {
            throw new IllegalStateException("Issue transforming XACML request into string");
        }
    }
}
