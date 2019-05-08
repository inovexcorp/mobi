package com.mobi.jaas.rest.impl;

/*-
 * #%L
 * com.mobi.jaas.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.powermock.api.mockito.PowerMockito.mock;
import static org.powermock.api.mockito.PowerMockito.mockStatic;
import static org.powermock.api.mockito.PowerMockito.verifyStatic;
import static org.powermock.api.mockito.PowerMockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.principals.UserPrincipal;
import com.mobi.jaas.api.utils.TokenUtils;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.web.security.util.RestSecurityUtils;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.Payload;
import com.nimbusds.jwt.SignedJWT;
import net.sf.json.JSONObject;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.oauth1.signature.Base64;
import org.glassfish.jersey.server.ResourceConfig;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.testng.IObjectFactory;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.ObjectFactory;
import org.testng.annotations.Test;

import java.io.IOException;
import java.text.ParseException;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import javax.security.auth.Subject;
import javax.ws.rs.client.Entity;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.Response;

@PowerMockIgnore({"javax.ws.*", "org.glassfish.*"})
@PrepareForTest({TokenUtils.class, RestSecurityUtils.class})
public class AuthRestImplTest extends MobiRestTestNg {

    private NewCookie authCookie;
    private NewCookie unauthCookie;

    private static final String TOKEN_STRING = "token";
    private static final String ERROR = "error";
    private static final String ANON = "anon";
    private static final String USERNAME = "username";
    private static final String PASSWORD = "password";
    private static final String VALID_USER = "{\"sub\": \"" + USERNAME + "\"}";
    private static final String ANON_USER = "{\"sub\": \"" + ANON + "\"}";
    private static final String TOKEN_NAME = "mobi_web_token";

    private EngineManager engineManager;
    private MobiConfiguration mobiConfiguration;
    private SignedJWT signedJWT;
    private SignedJWT unauthSignedJWT;
    private Role requiredRole;
    private Role otherRole;

    @ObjectFactory
    public IObjectFactory getObjectFactory() {
        return new org.powermock.modules.testng.PowerMockObjectFactory();
    }

    @BeforeMethod
    private void setupStaticMocks() throws Exception {
        reset(engineManager);

        when(engineManager.getUserRoles(anyString())).thenReturn(Collections.emptySet());
        when(engineManager.getUserRoles(USERNAME)).thenReturn(Collections.singleton(requiredRole));

        mockStatic(TokenUtils.class);
        when(TokenUtils.getTokenString(any(ContainerRequestContext.class))).thenReturn(TOKEN_STRING);
        when(TokenUtils.verifyToken(anyString())).thenReturn(Optional.empty());
        when(TokenUtils.verifyToken(TOKEN_STRING)).thenReturn(Optional.of(signedJWT));
        when(TokenUtils.generateauthToken(anyString())).thenReturn(signedJWT);
        when(TokenUtils.generateUnauthToken()).thenReturn(unauthSignedJWT);
        when(TokenUtils.createSecureTokenNewCookie(signedJWT)).thenReturn(authCookie);
        when(TokenUtils.createSecureTokenNewCookie(unauthSignedJWT)).thenReturn(unauthCookie);

        mockStatic(RestSecurityUtils.class);
        when(RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), anyString(), anyString(), eq(mobiConfiguration))).thenReturn(false);
        when(RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(USERNAME), eq(PASSWORD), eq(mobiConfiguration))).thenAnswer(i -> {
            Subject subject = i.getArgumentAt(1, Subject.class);
            subject.getPrincipals().add(new UserPrincipal(USERNAME));
            return true;
        });
    }

    @Override
    protected Application configureApp() throws Exception {
        ValueFactory vf = getValueFactory();

        engineManager = mock(EngineManager.class);
        mobiConfiguration = mock(MobiConfiguration.class);
        signedJWT = mock(SignedJWT.class);
        unauthSignedJWT = mock(SignedJWT.class);
        requiredRole = mock(Role.class);
        otherRole = mock(Role.class);

        authCookie = new NewCookie(TOKEN_NAME, USERNAME);
        unauthCookie = new NewCookie(TOKEN_NAME, ANON);

        when(requiredRole.getResource()).thenReturn(vf.createIRI("http://test.com/" + AuthRestImpl.REQUIRED_ROLE));
        when(otherRole.getResource()).thenReturn(vf.createIRI("http://test.com/other"));
        when(signedJWT.getPayload()).thenReturn(new Payload(VALID_USER));
        when(unauthSignedJWT.getPayload()).thenReturn(new Payload(ANON_USER));

        AuthRestImpl rest = new AuthRestImpl();
        rest.setConfiguration(mobiConfiguration);
        rest.setEngineManager(engineManager);

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @Test
    public void getCurrentUserTest() throws Exception {
        Response response = target().path("session").request().get();
        assertEquals(response.getStatus(), 200);
        verifyStatic();
        TokenUtils.getTokenString(any(ContainerRequestContext.class));
        verifyStatic();
        TokenUtils.verifyToken(TOKEN_STRING);
        verifyStatic(times(0));
        TokenUtils.generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(removeWhitespace(VALID_USER), removeWhitespace(result.toString()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCurrentUserNotVerifiedTest() throws Exception {
        // Setup:
        when(TokenUtils.getTokenString(any(ContainerRequestContext.class))).thenReturn(ERROR);

        Response response = target().path("session").request().get();
        assertEquals(response.getStatus(), 200);
        verifyStatic();
        TokenUtils.getTokenString(any(ContainerRequestContext.class));
        verifyStatic();
        TokenUtils.verifyToken(ERROR);
        verifyStatic();
        TokenUtils.generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertTrue(cookies.containsKey(TOKEN_NAME));
        assertEquals(ANON, cookies.get(TOKEN_NAME).getValue());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(removeWhitespace(ANON_USER), removeWhitespace(result.toString()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCurrentUserParseExceptionTest() throws Exception {
        // Setup:
        when(TokenUtils.verifyToken(anyString())).thenThrow(new ParseException("", 0));

        Response response = target().path("session").request().get();
        assertEquals(response.getStatus(), 500);
        verifyStatic();
        TokenUtils.getTokenString(any(ContainerRequestContext.class));
        verifyStatic();
        TokenUtils.verifyToken(TOKEN_STRING);
        verifyStatic(times(0));
        TokenUtils.generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void getCurrentUserIOExceptionTest() throws Exception {
        // Setup:
        when(TokenUtils.getTokenString(any(ContainerRequestContext.class))).thenReturn(ERROR);
        when(TokenUtils.generateUnauthToken()).thenThrow(new IOException());

        Response response = target().path("session").request().get();
        assertEquals(response.getStatus(), 500);
        verifyStatic();
        TokenUtils.getTokenString(any(ContainerRequestContext.class));
        verifyStatic();
        TokenUtils.verifyToken(ERROR);
        verifyStatic();
        TokenUtils.generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void getCurrentUserJOSEExceptionTest() throws Exception {
        // Setup:
        when(TokenUtils.verifyToken(anyString())).thenThrow(new JOSEException(""));

        Response response = target().path("session").request().get();
        assertEquals(response.getStatus(), 500);
        verifyStatic();
        TokenUtils.getTokenString(any(ContainerRequestContext.class));
        verifyStatic();
        TokenUtils.verifyToken(TOKEN_STRING);
        verifyStatic(times(0));
        TokenUtils.generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginNoCredsNoAuthTest() throws Exception {
        Response response = target().path("session").request().post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthNoUsernameTest() throws Exception {
        // Setup:
        String authorization = ":" + PASSWORD;

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.encode(authorization.getBytes())).post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        verifyStatic(times(0));
        TokenUtils.generateauthToken(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthNoPasswordTest() throws Exception {
        // Setup:
        String authorization = USERNAME + ":";

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.encode(authorization.getBytes())).post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        verifyStatic(times(0));
        TokenUtils.generateauthToken(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthInvalidTest() throws Exception {
        // Setup:
        String authorization = ANON + ":" + ERROR;

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.encode(authorization.getBytes())).post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        verifyStatic();
        RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(ANON), eq(ERROR), eq(mobiConfiguration));
        verifyStatic(times(0));
        TokenUtils.generateauthToken(anyString());
        verify(engineManager, times(0)).getUserRoles(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthValidNoPrincipalsTest() throws Exception {
        // Setup:
        String authorization = USERNAME + ":" + PASSWORD;
        when(RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(USERNAME), eq(PASSWORD), eq(mobiConfiguration))).thenReturn(true);

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.encode(authorization.getBytes())).post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        verifyStatic();
        RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(USERNAME), eq(PASSWORD), eq(mobiConfiguration));
        verifyStatic(times(0));
        TokenUtils.generateauthToken(anyString());
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
                .header("Authorization", "Basic " + Base64.encode(authorization.getBytes())).post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        verifyStatic();
        RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(USERNAME), eq(PASSWORD), eq(mobiConfiguration));
        verifyStatic(times(0));
        TokenUtils.generateauthToken(anyString());
        verify(engineManager).getUserRoles(USERNAME);
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginAuthValidTest() throws Exception {
        // Setup:
        String authorization = USERNAME + ":" + PASSWORD;

        Response response = target().path("session").request()
                .header("Authorization", "Basic " + Base64.encode(authorization.getBytes())).post(Entity.json(""));
        assertEquals(response.getStatus(), 200);
        verifyStatic();
        RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(USERNAME), eq(PASSWORD), eq(mobiConfiguration));
        verifyStatic();
        TokenUtils.generateauthToken(USERNAME);
        verify(engineManager).getUserRoles(USERNAME);
        Map<String, NewCookie> cookies = response.getCookies();
        assertTrue(cookies.containsKey(TOKEN_NAME));
        assertEquals(USERNAME, cookies.get(TOKEN_NAME).getValue());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(removeWhitespace(VALID_USER), removeWhitespace(result.toString()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void loginCredNoUsernameTest() throws Exception {
        // Setup:
        String authorization = ":" + PASSWORD;

        Response response = target().path("session").queryParam("password", PASSWORD).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        verifyStatic(times(0));
        TokenUtils.generateauthToken(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginCredNoPasswordTest() throws Exception {
        Response response = target().path("session").queryParam("username", USERNAME).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        verifyStatic(times(0));
        TokenUtils.generateauthToken(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginCredInvalidTest() throws Exception {
        Response response = target().path("session").queryParam("username", ANON).queryParam("password", ERROR).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        verifyStatic();
        RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(ANON), eq(ERROR), eq(mobiConfiguration));
        verifyStatic(times(0));
        TokenUtils.generateauthToken(anyString());
        verify(engineManager, times(0)).getUserRoles(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginCredValidNoPrincipalsTest() throws Exception {
        // Setup:
        when(RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(USERNAME), eq(PASSWORD), eq(mobiConfiguration))).thenReturn(true);

        Response response = target().path("session").queryParam("username", USERNAME).queryParam("password", PASSWORD).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        verifyStatic();
        RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(USERNAME), eq(PASSWORD), eq(mobiConfiguration));
        verifyStatic(times(0));
        TokenUtils.generateauthToken(anyString());
        verify(engineManager, times(0)).getUserRoles(anyString());
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginCredValidNoRequiredRoleTest() throws Exception {
        // Setup:
        when(engineManager.getUserRoles(USERNAME)).thenReturn(Collections.singleton(otherRole));

        Response response = target().path("session").queryParam("username", USERNAME).queryParam("password", PASSWORD).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 401);
        verifyStatic();
        RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(USERNAME), eq(PASSWORD), eq(mobiConfiguration));
        verifyStatic(times(0));
        TokenUtils.generateauthToken(anyString());
        verify(engineManager).getUserRoles(USERNAME);
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void loginCredValidTest() throws Exception {
        Response response = target().path("session").queryParam("username", USERNAME).queryParam("password", PASSWORD).request().post(Entity.json(""));
        assertEquals(response.getStatus(), 200);
        verifyStatic();
        RestSecurityUtils.authenticateUser(eq("mobi"), any(Subject.class), eq(USERNAME), eq(PASSWORD), eq(mobiConfiguration));
        verifyStatic();
        TokenUtils.generateauthToken(USERNAME);
        verify(engineManager).getUserRoles(USERNAME);
        Map<String, NewCookie> cookies = response.getCookies();
        assertTrue(cookies.containsKey(TOKEN_NAME));
        assertEquals(USERNAME, cookies.get(TOKEN_NAME).getValue());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(removeWhitespace(VALID_USER), removeWhitespace(result.toString()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void logoutTest() throws Exception {
        Response response = target().path("session").request().delete();
        assertEquals(response.getStatus(), 200);
        verifyStatic();
        TokenUtils.generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertTrue(cookies.containsKey(TOKEN_NAME));
        assertEquals(ANON, cookies.get(TOKEN_NAME).getValue());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(removeWhitespace(ANON_USER), removeWhitespace(result.toString()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void logoutJOSEExceptionTest() throws Exception {
        // Setup:
        when(TokenUtils.generateUnauthToken()).thenThrow(new JOSEException(""));

        Response response = target().path("session").request().delete();
        assertEquals(response.getStatus(), 500);
        verifyStatic();
        TokenUtils.generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    @Test
    public void logoutIOExceptionTest() throws Exception {
        // Setup:
        when(TokenUtils.generateUnauthToken()).thenThrow(new IOException(""));

        Response response = target().path("session").request().delete();
        assertEquals(response.getStatus(), 500);
        verifyStatic();
        TokenUtils.generateUnauthToken();
        Map<String, NewCookie> cookies = response.getCookies();
        assertEquals(0, cookies.size());
    }

    private String removeWhitespace(String s) {
        return s.replaceAll("\\s+", "");
    }
}
