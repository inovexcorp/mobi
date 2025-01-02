package com.mobi.itests.rest;

/*-
 * #%L
 * itests-rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.itests.rest.utils.RestITUtils;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.repository.api.OsgiRepository;
import org.apache.http.HttpStatus;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.karaf.itests.KarafTestSupport;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class UserRestIT extends KarafTestSupport {

    private static Boolean setupComplete = false;

    @Inject
    protected static BundleContext thisBundleContext;

    private final HttpClientContext context = HttpClientContext.create();

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
                            Paths.get(Objects.requireNonNull(this.getClass().getResource("/etc/org.ops4j.pax.logging.cfg")).toURI()).toFile()),
                    KarafDistributionOption.editConfigurationFilePut("etc/com.mobi.security.api.EncryptionService.cfg", "enabled", "false")
            ));
            return OptionUtils.combine(super.config(), options.toArray(new Option[0]));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        String dataFile = "testData.trig";
        Files.copy(thisBundleContext.getBundle().getEntry("/" + dataFile).openStream(), Paths.get(dataFile), StandardCopyOption.REPLACE_EXISTING);

        waitForService("(&(objectClass=com.mobi.etl.api.delimited.RDFImportService))", 10000L);
        waitForService("(&(objectClass=com.mobi.jaas.rest.AuthRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.jaas.rest.UserRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.impl.ThingFactory))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.conversion.ValueConverterRegistry))", 10000L);

        executeCommand(String.format("mobi:import -r system %s", dataFile));

        setupComplete = true;
    }

    @Test
    public void testDeleteUser() throws Exception {
        OsgiRepository repo = getOsgiService(OsgiRepository.class, "id=system", 30000L);
        ValueFactory vf = new ValidatingValueFactory();

        IRI user = vf.createIRI("http://mobi.com/users/45c571a156ddcef41351a713bcddee5ba7e95460");
        IRI inProgressCommit = vf.createIRI("https://mobi.com/in-progress-commits#c152d7b8-98f4-4337-909d-7fc6c62589f5");
        IRI inProgressAdditions = vf.createIRI("https://mobi.com/additions#c152d7b8-98f4-4337-909d-7fc6c62589f5");
        IRI inProgressDeletions = vf.createIRI("https://mobi.com/deletions#c152d7b8-98f4-4337-909d-7fc6c62589f5");
        IRI userState = vf.createIRI("http://mobi.com/states#e7eb17e0-4c26-4433-816e-2fb0a9608c42");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, user, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(User.TYPE)));
            assertTrue(ConnectionUtils.containsContext(conn, inProgressCommit));
            assertTrue(ConnectionUtils.containsContext(conn, inProgressAdditions));
            assertTrue(ConnectionUtils.containsContext(conn, inProgressDeletions));
            assertTrue(ConnectionUtils.contains(conn, userState, null, null));
        }

        try (CloseableHttpClient client = createHttpClient(); CloseableHttpResponse response = deleteUser(client, "testuser")) {
            assertNotNull(response);
            assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());
        } catch (IOException | GeneralSecurityException e) {
            fail("Exception thrown: " + e.getLocalizedMessage());
        }

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.contains(conn, user, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(User.TYPE)));
            assertFalse(ConnectionUtils.containsContext(conn, inProgressCommit));
            assertFalse(ConnectionUtils.containsContext(conn, inProgressAdditions));
            assertFalse(ConnectionUtils.containsContext(conn, inProgressDeletions));
            assertFalse(ConnectionUtils.contains(conn, userState, null, null));
        }
    }

    private CloseableHttpResponse deleteUser(CloseableHttpClient client, String username) throws IOException, GeneralSecurityException {
        authenticateUser(context, RestITUtils.getHttpsPort(configurationAdmin));
        HttpDelete delete = new HttpDelete(getBaseUrl(RestITUtils.getHttpsPort(configurationAdmin)) + "/users/" + URLEncoder.encode(username, StandardCharsets.UTF_8));
        return client.execute(delete, context);
    }
}
