package com.mobi.workflows.impl.dagu;

/*-
 * #%L
 * com.mobi.workflows.impl.dagu
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.server.api.Mobi;
import com.nimbusds.jwt.SignedJWT;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.ValueFactory;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.Builder;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import javax.servlet.http.Cookie;

public class DaguHttpClientTest extends OrmEnabledTestCase {
    private static final ValueFactory vf = getValueFactory();
    private static final ObjectMapper mapper = new ObjectMapper();
    private final String userName = "testUser";
    private final String hashString = "68335f26f9162a0a5bb2bd699970fe67d60b6ede";
    private final String yaml = """
            logDir: /var/folders/j1/thz_x72d0px10fcrwtvrrtlr0000gq/T/com.mobi.workflows.impl/dagu
            params: MOBI_HOST MOBI_TOKEN
            steps:
            - name: http://example.com/workflows/A/action
              command: echo "This is a test message from Workflow A\"""";

    //ORM factories
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private AutoCloseable closeable;

    private Cookie cookie;
    private SignedJWT signedJWT;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    Mobi mobi;

    @Mock
    TokenManager tokenManager;

    @Mock
    EngineManager engineManager;

    @Mock
    HttpClient httpClient;

    @Mock
    HttpResponse httpResponse;

    private DaguHttpClient daguHttpClient;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        signedJWT = mock(SignedJWT.class);
        cookie = mock(Cookie.class);

        when(mobi.getHostName()).thenReturn("https://localhost:8443/");
        when(engineManager.getUsername(vf.createIRI("http://test.org/user"))).thenReturn(Optional.of(userName));

        daguHttpClient = spy(new DaguHttpClient("http://127.0.0.1:8080", tokenManager, engineManager, mobi,
                null, null));
        daguHttpClient.client = httpClient;
    }

    @After
    public void reset() throws Exception {
        daguHttpClient = spy(new DaguHttpClient("http://127.0.0.1:8080", tokenManager, engineManager, mobi,
                null, null));
        Mockito.reset(mobi, tokenManager, httpClient, httpResponse);
        closeable.close();
    }

    @Test
    public void getTokenCookieTest() {
        //setup
        when(tokenManager.generateAuthToken(eq(userName))).thenReturn(signedJWT);
        when(tokenManager.createSecureTokenCookie(eq(signedJWT))).thenReturn(cookie);

        Cookie cookieResult = daguHttpClient.getTokenCookie(userName);
        assertEquals(cookieResult, cookie);
    }

    @Test
    public void getDagTest() throws IOException, InterruptedException {
        String daguResponse = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/dagResponse.txt")), StandardCharsets.UTF_8);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass()))).thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(daguResponse);

        ObjectNode actual = daguHttpClient.getDag(hashString);
        Assert.assertEquals(mapper.readValue(daguResponse, ObjectNode.class).toString(), actual.toString());
        verify(daguHttpClient, times(1)).addAuthHeader(any(HttpRequest.Builder.class));
    }

    @Test
    public void getDagErrorTest() throws IOException, InterruptedException {
        //setup
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass())))
                .thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(404);

        thrown.expect(MobiException.class);
        thrown.expectMessage("Could not connect to Dagu\n Status Code: 404\n  Body: ");

        daguHttpClient.getDag(hashString);
        verify(daguHttpClient, times(1)).addAuthHeader(any(HttpRequest.Builder.class));
    }

    @Test
    public void updateDagHttpCallTest() throws IOException, InterruptedException {
        //setup
        String daguResponse = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/dagResponse.txt")), StandardCharsets.UTF_8);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass())))
                .thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(daguResponse);
        when(tokenManager.generateAuthToken(eq(userName))).thenReturn(signedJWT);
        when(tokenManager.createSecureTokenCookie(eq(signedJWT))).thenReturn(cookie);

        daguHttpClient.getSchedulerLog(hashString);
        verify(daguHttpClient, times(1)).addAuthHeader(any(HttpRequest.Builder.class));
    }

    @Test
    public void updateDagHttpCallErrorTest() throws IOException, InterruptedException {
        //setup
        String daguResponse = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/dagResponse.txt")), StandardCharsets.UTF_8);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass())))
                .thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(400);
        when(httpResponse.body()).thenReturn(daguResponse);
        when(tokenManager.generateAuthToken(eq(userName))).thenReturn(signedJWT);
        when(tokenManager.createSecureTokenCookie(eq(signedJWT))).thenReturn(cookie);

        thrown.expect(MobiException.class);
        thrown.expectMessage("Could not update dag " + hashString + "\n  Status Code: 400\n  Body: " + daguResponse);

        daguHttpClient.updateDag(yaml, hashString);
        verify(daguHttpClient, times(1)).addAuthHeader(any(HttpRequest.Builder.class));
    }

    @Test
    public void getSchedulerLogRemote() throws IOException, InterruptedException {
        String daguResponse= IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/logResponse.txt")), StandardCharsets.UTF_8);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass()))).thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(daguResponse);

        ObjectNode actual = daguHttpClient.getSchedulerLog(hashString);
        Assert.assertEquals(mapper.readValue(daguResponse, ObjectNode.class).toString(), actual.toString());
        verify(daguHttpClient, times(1)).addAuthHeader(any(HttpRequest.Builder.class));
    }

    @Test
    public void getSchedulerLogRemoteFail() throws IOException, InterruptedException {
        //setup
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass()))).thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(400);

        thrown.expect(MobiException.class);
        thrown.expectMessage("Could not connect to Dagu\n Status Code: 400\n  Body: ");

        daguHttpClient.getSchedulerLog(hashString);
        verify(daguHttpClient, times(1)).addAuthHeader(any(HttpRequest.Builder.class));
    }

    @Test
    public void getSchedulerLogRemoteNoLogs() throws IOException, InterruptedException {
        String daguResponse = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/invalidLogResponse.txt")), StandardCharsets.UTF_8);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass()))).thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(daguResponse);

        ObjectNode actual = daguHttpClient.getSchedulerLog(hashString);
        Assert.assertEquals(mapper.readValue(daguResponse, ObjectNode.class).toString(), actual.toString());
        verify(daguHttpClient, times(1)).addAuthHeader(any(HttpRequest.Builder.class));
    }

    @Test
    public void addAuthHeaderTest() throws IOException, InterruptedException {
        daguHttpClient = spy(new DaguHttpClient("http://127.0.0.1:8080", tokenManager, engineManager, mobi,
                "test", "test"));
        daguHttpClient.client = httpClient;

        Builder requestBuilder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:8080/dags/dc5ead9cb65a662ddd0048af30e00a86a449cded"))
                .header("Accept", "application/json");

        daguHttpClient.addAuthHeader(requestBuilder);
        Map<String, List<String>> HeaderMap = requestBuilder.build().headers().map();
        Assert.assertTrue(HeaderMap.containsKey("Authorization"));
        Assert.assertEquals("Basic dGVzdDp0ZXN0", HeaderMap.get("Authorization").get(0));
    }
}
