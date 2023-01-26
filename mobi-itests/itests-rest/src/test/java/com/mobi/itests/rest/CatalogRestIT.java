package com.mobi.itests.rest;

/*-
 * #%L
 * itests-etl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.itests.rest.utils.RestITUtils;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpStatus;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.util.EntityUtils;
import org.apache.karaf.itests.KarafTestSupport;
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
import java.nio.charset.StandardCharsets;
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
public class CatalogRestIT extends KarafTestSupport {

    private static Boolean setupComplete = false;

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
        waitForService("(&(objectClass=com.mobi.catalog.rest.CatalogRest))", 10000L);

        setupComplete = true;
    }

    @Test
    public void testUpdateInProgressCommit() throws Exception {
        String recordId;
        HttpEntity entity = createUploadOntologyFormData("/BlankNodeRestrictionUpdate.ttl", "BlankNodeRestriction");

        try (CloseableHttpResponse response = uploadFile(createHttpClient(), entity)) {
            assertEquals(HttpStatus.SC_CREATED, response.getStatusLine().getStatusCode());
            String[] ids = parseAndValidateUploadResponse(response);
            recordId = ids[0];
        }

        String additions = IOUtils.toString(thisBundleContext.getBundle().getEntry("/BlankNodeRestrictionUpdate-additions.jsonld").openStream(), StandardCharsets.UTF_8);
        String deletions = IOUtils.toString(thisBundleContext.getBundle().getEntry("/BlankNodeRestrictionUpdate-deletions.jsonld").openStream(), StandardCharsets.UTF_8);
        String result = IOUtils.toString(thisBundleContext.getBundle().getEntry("/BlankNodeRestrictionUpdate-inProgressCommit.jsonld").openStream(), StandardCharsets.UTF_8).replaceAll("\\s", "");;

        HttpEntity inProgressCommitFormData = createUpdateInProgressCommitFormData(additions, deletions);
        try (CloseableHttpResponse response = updateInProgressCommit(createHttpClient(), inProgressCommitFormData, recordId)) {
            assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());
        }

        try (CloseableHttpResponse response = getInProgressCommit(createHttpClient(), recordId)) {
            assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());
            assertEquals(result, EntityUtils.toString(response.getEntity()));
        }
    }

    private HttpEntity createUploadOntologyFormData(String filename, String title) throws IOException {
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

    private HttpEntity createUpdateInProgressCommitFormData(String additions, String deletions) throws IOException {
        MultipartEntityBuilder mb = MultipartEntityBuilder.create();
        mb.addTextBody("additions", additions);
        mb.addTextBody("deletions", deletions);
        return mb.build();
    }

    private CloseableHttpResponse updateInProgressCommit(CloseableHttpClient client, HttpEntity entity, String recordId) throws IOException, GeneralSecurityException {
        authenticateUser(context, RestITUtils.getHttpsPort(configurationAdmin));
        StringBuilder sb = new StringBuilder();
        sb.append(getBaseUrl(RestITUtils.getHttpsPort(configurationAdmin)));
        sb.append("/catalogs/http%3A%2F%2Fmobi.com%2Fcatalog-local/records/");
        sb.append(URLEncoder.encode(recordId, StandardCharsets.UTF_8));
        sb.append("/in-progress-commit");
        HttpPut put = new HttpPut(sb.toString());
        put.setEntity(entity);
        return client.execute(put, context);
    }

    private CloseableHttpResponse getInProgressCommit(CloseableHttpClient client, String recordId) throws IOException, GeneralSecurityException {
        authenticateUser(context, RestITUtils.getHttpsPort(configurationAdmin));
        StringBuilder sb = new StringBuilder();
        sb.append(getBaseUrl(RestITUtils.getHttpsPort(configurationAdmin)));
        sb.append("/catalogs/http%3A%2F%2Fmobi.com%2Fcatalog-local/records/");
        sb.append(URLEncoder.encode(recordId, StandardCharsets.UTF_8));
        sb.append("/in-progress-commit");
        HttpGet get = new HttpGet(sb.toString());
        return client.execute(get, context);
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
}
