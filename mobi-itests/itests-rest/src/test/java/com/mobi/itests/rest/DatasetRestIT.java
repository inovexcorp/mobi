package com.mobi.itests.rest;

/*-
 * #%L
 * itests-rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertTrue;

import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.itests.support.KarafTestSupport;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.persistence.utils.Statements;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import org.apache.http.HttpEntity;
import org.apache.http.HttpStatus;
import org.apache.http.client.methods.CloseableHttpResponse;
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
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.util.Optional;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class DatasetRestIT extends KarafTestSupport {

    private static Boolean setupComplete = false;
    private final String DATA_FILE = "large_data.jsonld";

    @Inject
    protected static BundleContext thisBundleContext;

    private HttpClientContext context = HttpClientContext.create();

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        Files.copy(getBundleEntry(thisBundleContext, "/" + DATA_FILE), Paths.get(DATA_FILE));

        waitForService("(&(objectClass=com.mobi.ontology.rest.DatasetRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.jaas.rest.AuthRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.impl.ThingFactory))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.conversion.ValueConverterRegistry))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.api.ValueFactory))", 10000L);

        setupComplete = true;
    }

    @Test
    public void uploadDataToDataset() throws Exception {
        ValueFactory vf = getOsgiService(ValueFactory.class);
        Repository repo = getOsgiService(Repository.class, "id=system", 30000L);
        IRI datasetIRI = vf.createIRI(DatasetRecord.dataset_IRI);
        IRI repositoryIRI = vf.createIRI(DatasetRecord.repository_IRI);
        IRI systemDefaultNGIRI = vf.createIRI(Dataset.systemDefaultNamedGraph_IRI);
        Resource recordId, datasetId, systemDefaultNG;

        // Create Dataset to upload data into
        HttpEntity datasetEntity = createDatasetFormData("Test Dataset");
        try (CloseableHttpResponse response = createDataset(createHttpClient(), datasetEntity)) {
            assertEquals(HttpStatus.SC_CREATED, response.getStatusLine().getStatusCode());
            recordId = vf.createIRI(EntityUtils.toString(response.getEntity()));

            // Assert setup of DatasetRecord, Dataset, and system default named graph
            try (RepositoryConnection conn = repo.getConnection()) {
                assertTrue(conn.size(recordId) > 0);
                assertTrue(conn.getStatements(recordId, repositoryIRI, vf.createLiteral("system")).hasNext());
                RepositoryResult<Statement> datasetResults = conn.getStatements(recordId, datasetIRI, null);
                assertTrue(datasetResults.hasNext());
                Optional<Resource> opt1 = Statements.objectResource(datasetResults.next());
                assertTrue(opt1.isPresent());
                datasetId = opt1.get();
                assertTrue(conn.getStatements(datasetId, null, null).hasNext());
                RepositoryResult<Statement> sdngResults = conn.getStatements(datasetId, systemDefaultNGIRI, null);
                assertTrue(sdngResults.hasNext());
                Optional<Resource> opt2 = Statements.objectResource(sdngResults.next());
                assertTrue(opt2.isPresent());
                systemDefaultNG = opt2.get();
                assertTrue(conn.size(systemDefaultNG) == 0);
            }
        }

        // Upload Data to Dataset
        HttpEntity dataEntity = createUploadFormData(DATA_FILE);
        try (CloseableHttpResponse response = uploadFile(createHttpClient(), recordId, dataEntity)) {
            assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());

            // Assert data in system default named graph
            try (RepositoryConnection conn = repo.getConnection()) {
                assertTrue(conn.size(systemDefaultNG) > 0);
            }
        }
    }

    private HttpEntity createDatasetFormData(String title) throws IOException {
        MultipartEntityBuilder mb = MultipartEntityBuilder.create();
        mb.addTextBody("title", title);
        mb.addTextBody("repositoryId", "system");
        mb.addTextBody("description", "Test");
        mb.addTextBody("keywords", "Test");
        return mb.build();
    }

    private HttpEntity createUploadFormData(String fileName) throws IOException {
        MultipartEntityBuilder mb = MultipartEntityBuilder.create();
        InputStream ontology = getBundleEntry(thisBundleContext, fileName);
        mb.addBinaryBody("file", ontology, ContentType.APPLICATION_OCTET_STREAM, fileName);
        return mb.build();
    }

    private CloseableHttpResponse createDataset(CloseableHttpClient client, HttpEntity entity)
            throws IOException, GeneralSecurityException {
        authenticateUser(context);
        HttpPost post = new HttpPost(baseUrl + "/datasets");
        post.setEntity(entity);
        return client.execute(post, context);
    }

    private CloseableHttpResponse uploadFile(CloseableHttpClient client, Resource datasetId, HttpEntity entity)
            throws IOException, GeneralSecurityException {
        authenticateUser(context);
        HttpPost post = new HttpPost(baseUrl + "/datasets/" + ResourceUtils.encode(datasetId.stringValue()) + "/data");
        post.setEntity(entity);
        return client.execute(post, context);
    }
}
