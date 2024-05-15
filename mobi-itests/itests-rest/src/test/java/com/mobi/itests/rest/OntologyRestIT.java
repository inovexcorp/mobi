package com.mobi.itests.rest;

/*-
 * #%L
 * itests-etl
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

import static com.mobi.itests.rest.utils.RestITUtils.authenticateUser;
import static com.mobi.itests.rest.utils.RestITUtils.createHttpClient;
import static com.mobi.itests.rest.utils.RestITUtils.getBaseUrl;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.itests.rest.utils.RestITUtils;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.repository.api.OsgiRepository;
import org.apache.http.HttpEntity;
import org.apache.http.HttpStatus;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.util.EntityUtils;
import org.apache.karaf.itests.KarafTestSupport;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.ops4j.pax.exam.Configuration;
import org.ops4j.pax.exam.CoreOptions;
import org.ops4j.pax.exam.Option;
import org.ops4j.pax.exam.OptionUtils;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.karaf.options.KarafDistributionOption;
import org.ops4j.pax.exam.options.MavenArtifactUrlReference;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.BundleContext;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class OntologyRestIT extends KarafTestSupport {

    private static Boolean setupComplete = false;
    private static final ObjectMapper mapper = new ObjectMapper();

    @Inject
    protected static BundleContext thisBundleContext;

    private HttpClientContext context = HttpClientContext.create();

    @Override
    public MavenArtifactUrlReference getKarafDistribution() {
        return CoreOptions.maven().groupId("com.mobi").artifactId("mobi-distribution").versionAsInProject().type("tar.gz");
    }

    @Configuration
    @Override
    public Option[] config() {
        try {
            String httpsPort = Integer.toString(getAvailablePort(9540, 9999));
            List<Option> options = new ArrayList<>(Arrays.asList(
                    KarafDistributionOption.editConfigurationFilePut("etc/org.ops4j.pax.web.cfg", "org.osgi.service.http.port.secure", httpsPort),
                    KarafDistributionOption.replaceConfigurationFile("etc/org.ops4j.pax.logging.cfg",
                            Paths.get(this.getClass().getResource("/etc/org.ops4j.pax.logging.cfg").toURI()).toFile()),
                    KarafDistributionOption.editConfigurationFilePut("etc/com.mobi.security.api.EncryptionService.cfg", "enabled", "false"),
                    CoreOptions.vmOptions("-Dcom.sun.xml.bind.v2.runtime.reflect.opt.OptimizedAccessorFactory.noOptimization=true")
            ));
            return OptionUtils.combine(super.config(), options.toArray(new Option[0]));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        String ontology = "test-ontology.ttl";
        Files.copy(thisBundleContext.getBundle().getEntry("/" + ontology).openStream(), Paths.get(ontology), StandardCopyOption.REPLACE_EXISTING);

        String vocabulary = "test-vocabulary.ttl";
        Files.copy(thisBundleContext.getBundle().getEntry("/" + vocabulary).openStream(), Paths.get(vocabulary), StandardCopyOption.REPLACE_EXISTING);

        waitForService("(&(objectClass=com.mobi.ontology.impl.core.record.SimpleOntologyRecordService))", 10000L);
        waitForService("(&(objectClass=com.mobi.jaas.rest.AuthRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.ontology.rest.OntologyRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.impl.ThingFactory))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.conversion.ValueConverterRegistry))", 10000L);

        setupComplete = true;
    }

    @Test
    public void testDeleteOntology() throws Exception {
        Resource additionsGraphIRI;
        String recordId, branchId, commitId;
        ValueFactory vf = new ValidatingValueFactory();
        HttpEntity entity = createFormData("/test-ontology.ttl", "Test Ontology");

        try (CloseableHttpResponse response = uploadFile(createHttpClient(), entity)) {
            assertEquals(HttpStatus.SC_CREATED, response.getStatusLine().getStatusCode());
            String[] ids = parseAndValidateUploadResponse(response);
            recordId = ids[0];
            branchId = ids[1];
            commitId = ids[2];
            additionsGraphIRI = validateOntologyCreated(vf.createIRI(recordId), vf.createIRI(branchId), vf.createIRI(commitId));
        }

        try (CloseableHttpResponse response = deleteOntology(createHttpClient(), recordId)) {
            assertNotNull(response);
            assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());
            validateOntologyDeleted(vf.createIRI(recordId), vf.createIRI(branchId), vf.createIRI(commitId), additionsGraphIRI);
        } catch (IOException | GeneralSecurityException e) {
            fail("Exception thrown: " + e.getLocalizedMessage());
        }
    }

    @Test
    public void testDeleteVocabulary() throws Exception {
        Resource additionsGraphIRI;
        String recordId, branchId, commitId;
        ValueFactory vf = new ValidatingValueFactory();
        HttpEntity entity = createFormData("/test-vocabulary.ttl", "Test Vocabulary");

        try (CloseableHttpResponse response = uploadFile(createHttpClient(), entity)) {
            assertEquals(HttpStatus.SC_CREATED, response.getStatusLine().getStatusCode());
            String[] ids = parseAndValidateUploadResponse(response);
            recordId = ids[0];
            branchId = ids[1];
            commitId = ids[2];
            additionsGraphIRI = validateOntologyCreated(vf.createIRI(recordId), vf.createIRI(branchId), vf.createIRI(commitId));
        }

        try (CloseableHttpResponse response = deleteOntology(createHttpClient(), recordId)) {
            assertNotNull(response);
            assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());
            validateOntologyDeleted(vf.createIRI(recordId), vf.createIRI(branchId), vf.createIRI(commitId), additionsGraphIRI);
        } catch (IOException | GeneralSecurityException e) {
            fail("Exception thrown: " + e.getLocalizedMessage());
        }
    }

    private HttpEntity createFormData(String filename, String title) throws IOException {
        InputStream ontology = thisBundleContext.getBundle().getEntry(filename).openStream();
        MultipartEntityBuilder mb = MultipartEntityBuilder.create();
        mb.addBinaryBody("file", ontology, ContentType.APPLICATION_OCTET_STREAM, filename);
        mb.addTextBody("title", title);
        mb.addTextBody("description", "Test");
        mb.addTextBody("keywords", "Test");
        return mb.build();
    }

    private CloseableHttpResponse uploadFile(CloseableHttpClient client, HttpEntity entity) throws IOException, GeneralSecurityException {
        authenticateUser(context, RestITUtils.getHttpsPort(configurationAdmin));
        HttpPost post = new HttpPost(getBaseUrl(RestITUtils.getHttpsPort(configurationAdmin)) + "/ontologies");
        post.setEntity(entity);
        return client.execute(post, context);
    }

    private CloseableHttpResponse deleteOntology(CloseableHttpClient client, String recordId) throws IOException, GeneralSecurityException {
        authenticateUser(context, RestITUtils.getHttpsPort(configurationAdmin));
        HttpDelete delete = new HttpDelete(getBaseUrl(RestITUtils.getHttpsPort(configurationAdmin)) + "/ontologies/" + URLEncoder.encode(recordId, "UTF-8"));
        return client.execute(delete, context);
    }

    private String[] parseAndValidateUploadResponse(CloseableHttpResponse response) throws IOException {
        ObjectNode object = mapper.readValue(EntityUtils.toString(response.getEntity()), ObjectNode.class);
        String recordId = object.get("recordId").asText();
        String branchId = object.get("branchId").asText();
        String commitId = object.get("commitId").asText();
        assertNotNull(recordId);
        assertNotNull(branchId);
        assertNotNull(commitId);
        assertFalse(recordId.isEmpty());
        assertFalse(branchId.isEmpty());
        assertFalse(commitId.isEmpty());

        return new String[]{recordId, branchId, commitId};
    }

    private Resource validateOntologyCreated(Resource recordId, Resource branchId, Resource commitId) {
        IRI additionsGraphIRI;
        OsgiRepository repo = getOsgiService(OsgiRepository.class, "id=system", 30000L);
        ValueFactory vf = new ValidatingValueFactory();
        IRI branchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        IRI additionsIRI = vf.createIRI("http://mobi.com/ontologies/catalog#additions");

        try (RepositoryConnection conn = repo.getConnection()) {
            RepositoryResult<Statement> stmts = conn.getStatements(null, additionsIRI, null, commitId);

            assertTrue(stmts.hasNext());
            additionsGraphIRI = (IRI) stmts.next().getObject();
            assertTrue(conn.size(additionsGraphIRI) > 0);

            assertTrue(ConnectionUtils.contains(conn, null, null, null, recordId));
            assertTrue(ConnectionUtils.contains(conn, recordId, null, null));
            assertTrue(ConnectionUtils.contains(conn, recordId, branchIRI, branchId, recordId));
            assertTrue(ConnectionUtils.contains(conn, null, null, null, branchId));
            assertTrue(ConnectionUtils.contains(conn, branchId, null, null));
            assertTrue(ConnectionUtils.contains(conn, branchId, headIRI, commitId, branchId));
            assertTrue(ConnectionUtils.contains(conn, null, null, null, commitId));
            assertTrue(ConnectionUtils.contains(conn, commitId, null, null));
            stmts.close();
        }
        return additionsGraphIRI;
    }

    private void validateOntologyDeleted(Resource recordId, Resource branchId, Resource commitId, Resource additionsGraphIRI) {
        OsgiRepository repo = getOsgiService(OsgiRepository.class, "id=system", 30000L);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.contains(conn, null, null, null, branchId));
            assertFalse(ConnectionUtils.contains(conn, branchId, null, null));
            assertFalse(ConnectionUtils.contains(conn, null, null, null, recordId));
            assertFalse(ConnectionUtils.contains(conn, recordId, null, null));
            assertFalse(ConnectionUtils.contains(conn, null, null, null, commitId));
            assertFalse(ConnectionUtils.contains(conn, commitId, null, null));
            assertFalse(ConnectionUtils.contains(conn, null, null, null, additionsGraphIRI));
        }
    }
}
