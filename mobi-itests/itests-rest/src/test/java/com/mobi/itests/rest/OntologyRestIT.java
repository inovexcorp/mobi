package com.mobi.itests.rest;

/*-
 * #%L
 * itests-etl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
import static com.mobi.itests.rest.utils.RestITUtils.baseUrl;
import static com.mobi.itests.rest.utils.RestITUtils.createHttpClient;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.itests.support.KarafTestSupport;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import net.sf.json.JSONObject;
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
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.BundleContext;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class OntologyRestIT extends KarafTestSupport {

    private static Boolean setupComplete = false;

    @Inject
    protected static BundleContext thisBundleContext;

    private HttpClientContext context = HttpClientContext.create();

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        String ontology = "test-ontology.ttl";
        Files.copy(getBundleEntry(thisBundleContext, "/" + ontology), Paths.get(ontology));

        String vocabulary = "test-vocabulary.ttl";
        Files.copy(getBundleEntry(thisBundleContext, "/" + vocabulary), Paths.get(vocabulary));

        waitForService("(&(objectClass=com.mobi.ontology.impl.core.record.SimpleOntologyRecordService))", 10000L);
        waitForService("(&(objectClass=com.mobi.jaas.rest.AuthRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.ontology.rest.OntologyRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.impl.ThingFactory))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.conversion.ValueConverterRegistry))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.api.ValueFactory))", 10000L);

        setupComplete = true;
    }

    @Test
    public void testDeleteOntology() throws Exception {
        Resource additionsGraphIRI;
        String recordId, branchId, commitId;
        ValueFactory vf = getOsgiService(ValueFactory.class);
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
        ValueFactory vf = getOsgiService(ValueFactory.class);
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
        InputStream ontology = getBundleEntry(thisBundleContext, filename);
        MultipartEntityBuilder mb = MultipartEntityBuilder.create();
        mb.addBinaryBody("file", ontology, ContentType.APPLICATION_OCTET_STREAM, filename);
        mb.addTextBody("title", title);
        mb.addTextBody("description", "Test");
        mb.addTextBody("keywords", "Test");
        return mb.build();
    }

    private CloseableHttpResponse uploadFile(CloseableHttpClient client, HttpEntity entity) throws IOException, GeneralSecurityException {
        authenticateUser(context);
        HttpPost post = new HttpPost(baseUrl + "/ontologies");
        post.setEntity(entity);
        return client.execute(post, context);
    }

    private CloseableHttpResponse deleteOntology(CloseableHttpClient client, String recordId) throws IOException, GeneralSecurityException {
        authenticateUser(context);
        HttpDelete delete = new HttpDelete(baseUrl + "/ontologies/" + URLEncoder.encode(recordId, "UTF-8"));
        return client.execute(delete, context);
    }

    private String[] parseAndValidateUploadResponse(CloseableHttpResponse response) throws IOException {
        JSONObject object = JSONObject.fromObject(EntityUtils.toString(response.getEntity()));
        String recordId = object.get("recordId").toString();
        String branchId = object.get("branchId").toString();
        String commitId = object.get("commitId").toString();
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
        Repository repo = getOsgiService(Repository.class, "id=system", 30000L);
        ValueFactory vf = getOsgiService(ValueFactory.class);
        IRI branchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
        IRI headIRI = vf.createIRI(Branch.head_IRI);
        IRI additionsIRI = vf.createIRI("http://mobi.com/ontologies/catalog#additions");

        try (RepositoryConnection conn = repo.getConnection()) {
            RepositoryResult<Statement> stmts = conn.getStatements(null, additionsIRI, null, commitId);

            assertTrue(stmts.hasNext());
            additionsGraphIRI = (IRI) stmts.next().getObject();
            assertTrue(conn.size(additionsGraphIRI) > 0);

            assertTrue(conn.getStatements(null, null, null, recordId).hasNext());
            assertTrue(conn.getStatements(recordId, null, null).hasNext());
            assertTrue(conn.getStatements(recordId, branchIRI, branchId, recordId).hasNext());
            assertTrue(conn.getStatements(null, null, null, branchId).hasNext());
            assertTrue(conn.getStatements(branchId, null, null).hasNext());
            assertTrue(conn.getStatements(branchId, headIRI, commitId, branchId).hasNext());
            assertTrue(conn.getStatements(null, null, null, commitId).hasNext());
            assertTrue(conn.getStatements(commitId, null, null).hasNext());
        }
        return additionsGraphIRI;
    }

    private void validateOntologyDeleted(Resource recordId, Resource branchId, Resource commitId, Resource additionsGraphIRI) {
        Repository repo = getOsgiService(Repository.class, "id=system", 30000L);

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.getStatements(null, null, null, branchId).hasNext());
            assertFalse(conn.getStatements(branchId, null, null).hasNext());
            assertFalse(conn.getStatements(null, null, null, recordId).hasNext());
            assertFalse(conn.getStatements(recordId, null, null).hasNext());
            assertFalse(conn.getStatements(null, null, null, commitId).hasNext());
            assertFalse(conn.getStatements(commitId, null, null).hasNext());
            assertFalse(conn.getStatements(null, null, null, additionsGraphIRI).hasNext());
        }
    }
}
