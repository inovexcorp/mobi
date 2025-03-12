package com.mobi.jaas.rest;

/*-
 * #%L
 * com.mobi.jaas.rest
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.web.security.util.AuthenticationProps;
import com.nimbusds.jwt.SignedJWT;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.ValueFactory;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mockito;

import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import javax.security.auth.login.AppConfigurationEntry;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Form;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.Response;

public class AuthRestTest extends MobiRestTestCXF {

    private NewCookie authCookie;
    private NewCookie unauthCookie;

    private static final String TOKEN_STRING = "token";
    private static final String ERROR = "error";
    private static final String ANON = "anon";
    private static final String USERNAME = "username";
    private static final String PASSWORD = "password";
    private static final String TOKEN_NAME = "mobi_web_token";

    private static boolean error = false;
    private SignedJWT signedJWT;
    private SignedJWT unauthSignedJWT;
    private Role requiredRole;
    private Role otherRole;
    private User user;
    private Literal usernameLit;
    private Map<String, Object> configMap;

    // Mock services used in server
    private static EngineManager engineManager;
    private static MobiConfiguration mobiConfiguration;
    private static TokenManager tokenManager;
    private static ValueFactory vf;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();

        engineManager = mock(EngineManager.class);
        mobiConfiguration = mock(MobiConfiguration.class);
        tokenManager = mock(TokenManager.class);

        AuthRest rest = new AuthRest();
        rest.setConfiguration(mobiConfiguration);
        rest.setEngineManager(engineManager);
        rest.setTokenManager(tokenManager);

        configureServer(rest, requestContext -> requestContext.setProperty(AuthenticationProps.USERNAME, getUsername()));
    }

    @Before
    public void setupStaticMocks() throws Exception {
        signedJWT = mock(SignedJWT.class);
        unauthSignedJWT = mock(SignedJWT.class);
        requiredRole = mock(Role.class);
        otherRole = mock(Role.class);
        user = mock(User.class);
        usernameLit = mock(Literal.class);

        authCookie = new NewCookie(TOKEN_NAME, USERNAME);
        unauthCookie = new NewCookie(TOKEN_NAME, ANON);

        when(usernameLit.stringValue()).thenReturn(USERNAME);
        when(user.getUsername()).thenReturn(Optional.of(usernameLit));
        when(requiredRole.getResource()).thenReturn(vf.createIRI("http://test.com/" + AuthRest.REQUIRED_ROLE));
        when(otherRole.getResource()).thenReturn(vf.createIRI("http://test.com/other"));

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(engineManager.getUserRoles(anyString())).thenReturn(Collections.emptySet());
        when(engineManager.getUserRoles(USERNAME)).thenReturn(Collections.singleton(requiredRole));

        when(tokenManager.getTokenString(any(HttpServletRequest.class))).thenReturn(TOKEN_STRING);
        when(tokenManager.verifyToken(anyString())).thenReturn(Optional.empty());
        when(tokenManager.verifyToken(TOKEN_STRING)).thenReturn(Optional.of(signedJWT));
        when(tokenManager.generateAuthToken(anyString())).thenReturn(signedJWT);
        when(tokenManager.generateUnauthToken()).thenReturn(unauthSignedJWT);
        when(tokenManager.createSecureTokenNewCookie(signedJWT)).thenReturn(authCookie);
        when(tokenManager.createSecureTokenNewCookie(unauthSignedJWT)).thenReturn(unauthCookie);

        configMap = new HashMap<>();
        configMap.put("module", LoginTestModule.class.getName());
        configMap.put("principals", true);
        AppConfigurationEntry entry = new AppConfigurationEntry(LoginTestModule.class.getName(), AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL, configMap);
        when(mobiConfiguration.getAppConfigurationEntry(anyString())).thenReturn(new AppConfigurationEntry[]{entry});
    }

    @After
    public void reset() {
        Mockito.reset(mobiConfiguration, engineManager, tokenManager);
    }

    private static String getUsername() {
        if (error) {
            return null;
        } else {
            return USERNAME;
        }
    }

    @Test
    public void getCurrentUserTest() throws Exception {
        // Setup:
        error = false;

        Response response = target().path("session").request().get();
        assertEquals(response.getStatus(), 200);
        verify(tokenManager, never()).generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
        assertEquals(USERNAME, response.readEntity(String.class));
    }

    @Test
    public void getCurrentUserNotVerifiedTest() throws Exception {
        // Setup:
        error = true;

        Response response = target().path("session").request().get();
        assertEquals(response.getStatus(), 200);
        verify(tokenManager).generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertTrue(cookies.containsKey(TOKEN_NAME));
        assertEquals(ANON, cookies.get(TOKEN_NAME).getValue());
        assertTrue(response.readEntity(String.class).isEmpty());
    }

    @Test
    public void loginNoCredsNoAuthTest() throws Exception {
        Response response = target().path("session").request()
                .post(Entity.entity(new Form(), MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthNoUsernameTest() throws Exception {
        // Setup:
        String authorization = ":" + PASSWORD;

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.getEncoder().encodeToString(authorization.getBytes())).post(Entity.entity(new Form(), MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        verify(tokenManager, never()).generateAuthToken(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthNoPasswordTest() throws Exception {
        // Setup:
        String authorization = USERNAME + ":";

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.getEncoder().encodeToString(authorization.getBytes())).post(Entity.entity(new Form(), MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        verify(tokenManager, never()).generateAuthToken(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthInvalidTest() throws Exception {
        // Setup:
        String authorization = ANON + ":" + ERROR;

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.getEncoder().encodeToString(authorization.getBytes())).post(Entity.entity(new Form(), MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        verify(tokenManager, never()).generateAuthToken(anyString());
        verify(engineManager).getUserRoles(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthValidNoPrincipalsTest() throws Exception {
        // Setup:
        String authorization = USERNAME + ":" + PASSWORD;
        configMap.put("principals", false);

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.getEncoder().encodeToString(authorization.getBytes())).post(Entity.entity(new Form(), MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        verify(tokenManager, never()).generateAuthToken(anyString());
        verify(engineManager, times(0)).getUserRoles(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthValidNoRequiredRoleTest() throws Exception {
        // Setup:
        String authorization = USERNAME + ":" + PASSWORD;
        when(engineManager.getUserRoles(USERNAME)).thenReturn(Collections.singleton(otherRole));

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.getEncoder().encodeToString(authorization.getBytes())).post(Entity.entity(new Form(), MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        verify(tokenManager, never()).generateAuthToken(anyString());
        verify(engineManager).getUserRoles(USERNAME);
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthValidTest() throws Exception {
        // Setup:
        String authorization = USERNAME + ":" + PASSWORD;

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.getEncoder().encodeToString(authorization.getBytes()))
                .post(Entity.entity(new Form(), MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 200);
        verify(tokenManager).generateAuthToken(USERNAME);
        verify(engineManager).getUserRoles(USERNAME);
        Map<String, NewCookie> cookies = response.getCookies();
        assertTrue(cookies.containsKey(TOKEN_NAME));
        assertEquals(USERNAME, cookies.get(TOKEN_NAME).getValue());
        assertEquals(USERNAME, response.readEntity(String.class));
    }

    @Test
    public void loginCredNoUsernameTest() throws Exception {
        // Setup:
        Form form = new Form ();
        form.param ("password", PASSWORD);
        Response response = target().path("session")
                .request()
                .post(Entity.entity(new Form(), MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        verify(tokenManager, never()).generateAuthToken(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginCredNoPasswordTest() throws Exception {
        Form form = new Form ();
        form.param ("username", USERNAME);
        Response response = target().path("session")
                .request().post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        verify(tokenManager, never()).generateAuthToken(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginCredInvalidTest() throws Exception {
        Form form = new Form();
        form.param("username", ANON);
        form.param("password", ERROR);
        Response response = target().path("session")
                .request().post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        verify(tokenManager, never()).generateAuthToken(anyString());
        verify(engineManager).getUserRoles(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginCredValidNoPrincipalsTest() throws Exception {
        // Setup:
        configMap.put("principals", false);
        Form form = new Form();
        form.param("username", USERNAME);
        form.param("password", PASSWORD);

        Response response = target().path("session")
                .request().post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        verify(tokenManager, never()).generateAuthToken(anyString());
        verify(engineManager, times(0)).getUserRoles(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginCredValidNoRequiredRoleTest() throws Exception {
        // Setup:
        when(engineManager.getUserRoles(USERNAME)).thenReturn(Collections.singleton(otherRole));
        Form form = new Form();
        form.param("username", USERNAME);
        form.param("password", PASSWORD);
        Response response = target().path("session")
                .request().post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 401);
        verify(tokenManager, never()).generateAuthToken(anyString());
        verify(engineManager).getUserRoles(USERNAME);
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginCredValidTest() throws Exception {
        Form form = new Form();
        form.param("username", USERNAME);
        form.param("password", PASSWORD);
        Response response = target().path("session")
                .request()
                .post(Entity.entity(form, MediaType.APPLICATION_FORM_URLENCODED));
        assertEquals(response.getStatus(), 200);
        verify(tokenManager).generateAuthToken(USERNAME);
        verify(engineManager).getUserRoles(USERNAME);
        Map<String, NewCookie> cookies = response.getCookies();
        assertTrue(cookies.containsKey(TOKEN_NAME));
        assertEquals(USERNAME, cookies.get(TOKEN_NAME).getValue());
        assertEquals(USERNAME, response.readEntity(String.class));
    }

    @Test
    public void logoutTest() throws Exception {
        Response response = target().path("session").request().delete();
        assertEquals(response.getStatus(), 200);
        verify(tokenManager).generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertTrue(cookies.containsKey(TOKEN_NAME));
        assertEquals(ANON, cookies.get(TOKEN_NAME).getValue());
        assertTrue(response.readEntity(String.class).isEmpty());
    }
}
