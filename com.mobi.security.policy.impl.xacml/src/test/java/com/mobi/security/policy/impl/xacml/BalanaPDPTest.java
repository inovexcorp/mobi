package com.mobi.security.policy.impl.xacml;

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

import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.junit.Before;
import org.junit.Test;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;
import org.w3c.dom.Document;

import java.io.ByteArrayInputStream;
import java.io.StringWriter;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

public class BalanaPDPTest extends OrmEnabledTestCase {
    private Repository repo;
    private BalanaPDP pdp;
    private BalanaPIP pip;
    private BalanaPRP prp;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/users/UserX"), VALUE_FACTORY.createIRI("http://mobi.com/ontologies/user/management#hasUserRole"), VALUE_FACTORY.createIRI("http://mobi.com/roles/admin")));
        }

        pip = new BalanaPIP();
        pip.setRepo(repo);
        pip.setVf(VALUE_FACTORY);
        pip.setUp();
        prp = new BalanaPRP();
        injectOrmFactoryReferencesIntoService(prp);
        prp.setRepo(repo);
        prp.setMf(MODEL_FACTORY);
        prp.setVf(VALUE_FACTORY);
        pdp = new BalanaPDP();
        pdp.setBalanaPIP(pip);
        pdp.setBalanaPRP(prp);
        pdp.setUp();
    }

    @Test
    public void test() throws Exception {
        String request = "<Request xmlns=\"urn:oasis:names:tc:xacml:3.0:core:schema:wd-17\" CombinedDecision=\"false\" ReturnPolicyIdList=\"false\">\n" +
                "  <Attributes Category=\"urn:oasis:names:tc:xacml:1.0:subject-category:access-subject\">\n" +
                "    <Attribute IncludeInResult=\"false\" AttributeId=\"urn:oasis:names:tc:xacml:1.0:subject:subject-id\">\n" +
                "      <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">http://mobi.com/users/UserX</AttributeValue>\n" +
                "    </Attribute>\n" +
                "  </Attributes>\n" +
                "  <Attributes Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:resource\">\n" +
                "    <Attribute IncludeInResult=\"false\" AttributeId=\"urn:oasis:names:tc:xacml:1.0:resource:resource-id\">\n" +
                "      <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">http://mobi.com/catalogs/local-catalog</AttributeValue>\n" +
                "    </Attribute>\n" +
                "  </Attributes>\n" +
                "  <Attributes Category=\"urn:oasis:names:tc:xacml:3.0:attribute-category:action\">\n" +
                "    <Attribute IncludeInResult=\"false\" AttributeId=\"urn:oasis:names:tc:xacml:1.0:action:action-id\">\n" +
                "      <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">create</AttributeValue>\n" +
                "    </Attribute>\n" +
                "    <Attribute IncludeInResult=\"false\" AttributeId=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#type\">\n" +
                "      <AttributeValue DataType=\"http://www.w3.org/2001/XMLSchema#string\">http://mobi.com/ontologies/ontology-editor#OntologyRecord</AttributeValue>\n" +
                "    </Attribute>\n" +
                "  </Attributes>\n" +
                "</Request>";
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        Document requestDoc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(request.getBytes()));
        Document result = pdp.evaluate(requestDoc);
        System.out.println(documentToString(result));
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
