package com.mobi.itests.rest.utils;

/*-
 * #%L
 * itests-rest
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.apache.http.HttpHost;
import org.apache.http.HttpStatus;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.TrustStrategy;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;
import org.osgi.service.cm.ConfigurationAdmin;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;

public class RestITUtils {

    public static String username = "admin";
    public static String password = "admin";
    private static final String hostUrl = "https://localhost:";
    private static final String path =  "/mobirest";

    public static CloseableHttpClient createHttpClient() throws GeneralSecurityException {
        SSLContextBuilder builder = new SSLContextBuilder();
        builder.loadTrustMaterial(null, (TrustStrategy) (chain, authType) -> true);
        SSLConnectionSocketFactory factory = new SSLConnectionSocketFactory(builder.build(), (s, sslSession) -> true);
        return HttpClients.custom().setSSLSocketFactory(factory).build();
    }

    public static CloseableHttpClient createBasicAuthHttpClient(HttpClientContext context, int port) throws GeneralSecurityException {
        SSLContextBuilder builder = new SSLContextBuilder();
        builder.loadTrustMaterial(null, (TrustStrategy) (chain, authType) -> true);
        SSLConnectionSocketFactory factory = new SSLConnectionSocketFactory(builder.build(), (s, sslSession) -> true);
        CredentialsProvider provider = new BasicCredentialsProvider();
        UsernamePasswordCredentials credentials
                = new UsernamePasswordCredentials(username, password);
        provider.setCredentials(AuthScope.ANY, credentials);

        AuthCache authCache = new BasicAuthCache();

        BasicScheme basicAuth = new BasicScheme();
        authCache.put(new HttpHost("localhost", port, "https"), basicAuth);

        context.setCredentialsProvider(provider);
        context.setAuthCache(authCache);
        return HttpClients.custom().setSSLSocketFactory(factory).setDefaultCredentialsProvider(provider).build();
    }

    public static void authenticateUser(HttpClientContext context, String port)
            throws IOException, GeneralSecurityException {
        try (CloseableHttpClient client = createHttpClient()) {
            // Added retries due to server not being ready before trying to authenticate
            int status = -1;
            int count = 0;
            while (count < 3) {
                HttpPost post = new HttpPost(getBaseUrl(port) + "/session?password="
                        + URLEncoder.encode(password, StandardCharsets.UTF_8) + "&username="
                        + URLEncoder.encode(username, StandardCharsets.UTF_8));
                CloseableHttpResponse response = client.execute(post, context);
                assertNotNull(response);
                status = response.getStatusLine().getStatusCode();
                if (status != HttpStatus.SC_OK) {
                    count++;
                    Thread.sleep(3000);
                } else {
                    break;
                }
            }
            assertEquals(HttpStatus.SC_OK, status);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static String getBaseUrl(String port) {
        return hostUrl + port + path;
    }

    public static String getHttpsPort(ConfigurationAdmin configurationAdmin) throws IOException {
        org.osgi.service.cm.Configuration configuration = configurationAdmin.getConfiguration("org.ops4j.pax.web", null);
        if (configuration != null) {
            return configuration.getProperties().get("org.osgi.service.http.port.secure").toString();
        }
        return "9082";
    }
}
