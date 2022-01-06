package com.mobi.itests.rest;

/*-
 * #%L
 * itests-rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import static com.mobi.itests.rest.utils.RestITUtils.createBasicAuthHttpClient;
import static com.mobi.itests.rest.utils.RestITUtils.createHttpClient;
import static com.mobi.itests.rest.utils.RestITUtils.getBaseUrl;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.fail;

import com.mobi.itests.rest.utils.RestITUtils;
import com.sun.net.httpserver.Headers;
import org.apache.http.Header;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.junit.Before;

import com.mobi.itests.support.KarafTestSupport;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.ops4j.pax.exam.junit.PaxExam;
import org.ops4j.pax.exam.spi.reactors.ExamReactorStrategy;
import org.ops4j.pax.exam.spi.reactors.PerClass;
import org.osgi.framework.BundleContext;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import javax.inject.Inject;

@RunWith(PaxExam.class)
@ExamReactorStrategy(PerClass.class)
public class BasicAuthRestIT extends KarafTestSupport {

    private static Boolean setupComplete = false;

    private HttpClientContext context = HttpClientContext.create();

    @Inject
    protected static BundleContext thisBundleContext;

    @Before
    public synchronized void setup() throws Exception {
        if (setupComplete) return;

        waitForService("(&(objectClass=com.mobi.catalog.impl.SimpleCatalogUtilsService))", 10000L);
        waitForService("(&(objectClass=com.mobi.catalog.impl.SimpleCatalogManager))", 10000L);
        waitForService("(&(objectClass=com.mobi.jaas.rest.AuthRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.catalog.rest.CatalogRest))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.impl.ThingFactory))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.orm.conversion.ValueConverterRegistry))", 10000L);
        waitForService("(&(objectClass=com.mobi.rdf.api.ValueFactory))", 10000L);

        setupComplete = true;
    }

    @Test
    public void testToken() throws Exception {
        try (CloseableHttpResponse response = getCatalogs(createHttpClient())) {
            assertNotNull(response);
            assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());
        } catch (IOException | GeneralSecurityException e) {
            fail("Exception thrown: " + e.getLocalizedMessage());
        }
    }

    @Test
    public void testNoAuth() throws Exception {
        try (CloseableHttpResponse response = getCatalogsNoAuth(createHttpClient())) {
            assertNotNull(response);
            assertEquals(HttpStatus.SC_FORBIDDEN, response.getStatusLine().getStatusCode());
        } catch (IOException | GeneralSecurityException e) {
            fail("Exception thrown: " + e.getLocalizedMessage());
        }
    }

    @Test
    public void testBasicAuth() throws Exception {
        try (CloseableHttpResponse response = getCatalogsBasicAuth(createBasicAuthHttpClient(context, Integer.parseInt(getHttpsPort())))) {
            Header[] headers = response.getAllHeaders();
            for (Header header : headers) {
                System.out.print(header.getName() + ":" + header.getValue());
            }
            assertNotNull(response);
            assertEquals(HttpStatus.SC_OK, response.getStatusLine().getStatusCode());
        } catch (IOException | GeneralSecurityException e) {
            fail("Exception thrown: " + e.getLocalizedMessage());
        }
    }

    private CloseableHttpResponse getCatalogs(CloseableHttpClient client) throws IOException, GeneralSecurityException {
        authenticateUser(context, getHttpsPort());
        HttpGet get = new HttpGet(getBaseUrl(getHttpsPort()) + "/catalogs");
        return client.execute(get, context);
    }

    private CloseableHttpResponse getCatalogsNoAuth(CloseableHttpClient client) throws IOException, GeneralSecurityException {
        HttpGet get = new HttpGet(getBaseUrl(getHttpsPort()) + "/catalogs");
        return client.execute(get, context);
    }

    private CloseableHttpResponse getCatalogsBasicAuth(CloseableHttpClient client) throws IOException, GeneralSecurityException {
        HttpGet get = new HttpGet(getBaseUrl(getHttpsPort()) + "/catalogs");
        return client.execute(get, context);
    }
}
