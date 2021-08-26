package com.mobi.itests.rest;

/*-
 * #%L
 * itests-rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

import com.mobi.itests.support.KarafTestSupport;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.http.HttpStatus;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.impl.client.CloseableHttpClient;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.BundleContext;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class UserRestIT extends KarafTestSupport {

    private static Boolean setupComplete = false;

    @Inject
    protected static BundleContext thisBundleContext;

    private HttpClientContext context = HttpClientContext.create();

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        String dataFile = "testData.trig";
        Files.copy(getBundleEntry(thisBundleContext, "/" + dataFile), Paths.get(dataFile));

        waitForService("(&(objectClass=com.mobi.etl.api.delimited.RDFImportService))", 10000L);
        waitForService("(&(objectClass=com.mobi.jaas.rest.AuthRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.jaas.rest.UserRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.impl.ThingFactory))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.conversion.ValueConverterRegistry))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.api.ValueFactory))", 10000L);

        executeCommand(String.format("mobi:import -r system %s", dataFile));

        setupComplete = true;
    }

    @Test
    public void testDeleteUser() throws Exception {
        Repository repo = getOsgiService(Repository.class, "id=system", 30000L);
        ValueFactory vf = getOsgiService(ValueFactory.class);

        IRI user = vf.createIRI("http://mobi.com/users/45c571a156ddcef41351a713bcddee5ba7e95460");
        IRI inProgressCommit = vf.createIRI("https://mobi.com/in-progress-commits#c152d7b8-98f4-4337-909d-7fc6c62589f5");
        IRI inProgressAdditions = vf.createIRI("https://mobi.com/additions#c152d7b8-98f4-4337-909d-7fc6c62589f5");
        IRI inProgressDeletions = vf.createIRI("https://mobi.com/deletions#c152d7b8-98f4-4337-909d-7fc6c62589f5");
        IRI userState = vf.createIRI("http://mobi.com/states#e7eb17e0-4c26-4433-816e-2fb0a9608c42");

        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(conn.contains(user, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(User.TYPE)));
            assertTrue(conn.containsContext(inProgressCommit));
            assertTrue(conn.containsContext(inProgressAdditions));
            assertTrue(conn.containsContext(inProgressDeletions));
            assertTrue(conn.contains(userState, null, null));
        }

        try (CloseableHttpResponse response = deleteUser(createHttpClient(), "testuser")) {
            assertNotNull(response);
            assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());
        } catch (IOException | GeneralSecurityException e) {
            fail("Exception thrown: " + e.getLocalizedMessage());
        }

        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(conn.contains(user, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(User.TYPE)));
            assertFalse(conn.containsContext(inProgressCommit));
            assertFalse(conn.containsContext(inProgressAdditions));
            assertFalse(conn.containsContext(inProgressDeletions));
            assertFalse(conn.contains(userState, null, null));
        }
    }

    private CloseableHttpResponse deleteUser(CloseableHttpClient client, String username) throws IOException, GeneralSecurityException {
        authenticateUser(context, getHttpsPort());
        HttpDelete delete = new HttpDelete(getBaseUrl(getHttpsPort()) + "/users/" + URLEncoder.encode(username, "UTF-8"));
        return client.execute(delete, context);
    }
}
