package com.mobi.jaas.token;

/*-
 * #%L
 * com.mobi.jaas.token
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


import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.exception.MobiException;
import com.mobi.jaas.api.token.TokenVerifier;
import com.mobi.jaas.config.SimpleTokenConfig;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.NewCookie;

public class SimpleTokenManagerTest {
    private AutoCloseable closeable;
    SimpleTokenManager manager;

    static final String MOBI_TOKEN = "mobi";
    static final String OTHER_TOKEN = "other";

    @Mock
    public SimpleTokenConfig config;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private MobiTokenVerifier mobiTokenVerifier;

    @Mock
    private TokenVerifier otherVerifier;

    @Mock
    private SignedJWT jwt;

    @Mock
    private ContainerRequestContext requestContext;

    @Mock
    private HttpServletRequest servletRequest;

    @Mock
    private Cookie servletCookie;

    @Mock
    private javax.ws.rs.core.Cookie cookie;

    @Before
    public void setup() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        when(jwt.serialize()).thenReturn(MOBI_TOKEN);
        when(servletCookie.getName()).thenReturn(SimpleTokenManager.TOKEN_NAME);
        when(servletCookie.getValue()).thenReturn(MOBI_TOKEN);
        when(cookie.getValue()).thenReturn(MOBI_TOKEN);
        when(mobiTokenVerifier.getName()).thenReturn("MobiVerifier");
        when(mobiTokenVerifier.verifyToken(anyString())).thenReturn(Optional.empty());
        when(mobiTokenVerifier.verifyToken(MOBI_TOKEN)).thenReturn(Optional.of(jwt));
        when(mobiTokenVerifier.generateToken(anyString(), anyString(), anyString(), anyLong(), any())).thenReturn(jwt);
        when(otherVerifier.getName()).thenReturn("OtherVerifier");
        when(otherVerifier.verifyToken(anyString())).thenReturn(Optional.empty());
        when(otherVerifier.verifyToken(OTHER_TOKEN)).thenReturn(Optional.of(jwt));
        Map<String, javax.ws.rs.core.Cookie> cookies = new HashMap<>();
        cookies.put(SimpleTokenManager.TOKEN_NAME, cookie);
        when(requestContext.getCookies()).thenReturn(cookies);
        when(servletRequest.getCookies()).thenReturn(new Cookie[]{servletCookie});

        when(config.tokenDurationMins()).thenReturn((long) 1440);

        manager = new SimpleTokenManager();
        manager.setMobiTokenVerifier(mobiTokenVerifier);
        manager.addVerifier(mobiTokenVerifier);
        manager.addVerifier(otherVerifier);
        manager.start(config);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void verifyTokenNotValidTest() throws Exception {
        Optional<SignedJWT> result = manager.verifyToken("error");
        assertFalse(result.isPresent());
        verify(mobiTokenVerifier).verifyToken("error");
        verify(otherVerifier).verifyToken("error");
    }

    @Test
    public void verifyTokenIllegalArgumentTest() throws Exception {
        // Setup:
        when(mobiTokenVerifier.verifyToken("error")).thenThrow(new IllegalArgumentException());

        Optional<SignedJWT> result = manager.verifyToken("error");
        assertFalse(result.isPresent());
        verify(mobiTokenVerifier).verifyToken("error");
        verify(otherVerifier).verifyToken("error");
    }

    @Test
    public void verifyTokenOneValidTest() throws Exception {
        Optional<SignedJWT> result = manager.verifyToken(MOBI_TOKEN);
        assertTrue(result.isPresent());
        assertEquals(jwt, result.get());
        verify(mobiTokenVerifier).verifyToken(MOBI_TOKEN);
    }

    @Test
    public void generateUnauthTokenTest() throws Exception {
        SignedJWT result = manager.generateUnauthToken();
        assertEquals(jwt, result);
        verify(mobiTokenVerifier).generateToken("anon", SimpleTokenManager.ISSUER, SimpleTokenManager.ANON_SCOPE, 86400000, null);
    }

    @Test
    public void generateUnauthTokenExceptionTest() throws Exception {
        // Setup:
        when(mobiTokenVerifier.generateToken(anyString(), anyString(), anyString(), anyLong(), any())).thenThrow(new JOSEException(""));
        thrown.expect(MobiException.class);

        SignedJWT result = manager.generateUnauthToken();
        assertEquals(jwt, result);
        verify(mobiTokenVerifier).generateToken("anon", SimpleTokenManager.ISSUER, SimpleTokenManager.ANON_SCOPE, 86400000, null);
    }

    @Test
    public void generateAuthTokenTest() throws Exception {
        // Setup:
        when(config.tokenDurationMins()).thenReturn((long) 1);
        manager.start(config);

        SignedJWT result = manager.generateAuthToken("username");
        assertEquals(jwt, result);
        verify(mobiTokenVerifier).generateToken("username", SimpleTokenManager.ISSUER, SimpleTokenManager.AUTH_SCOPE, 60000, null);
    }

    @Test
    public void generateZeroTokenTest() throws Exception {
        // Setup:
        when(config.tokenDurationMins()).thenReturn((long) 0);
        manager.start(config);

        SignedJWT result = manager.generateAuthToken("username");
        assertEquals(jwt, result);
        verify(mobiTokenVerifier).generateToken("username", SimpleTokenManager.ISSUER, SimpleTokenManager.AUTH_SCOPE, 86400000, null);
    }

    @Test
    public void generateNegativeTokenTest() throws Exception {
        // Setup:
        when(config.tokenDurationMins()).thenReturn((long) -500000);
        manager.start(config);

        SignedJWT result = manager.generateAuthToken("username");
        assertEquals(jwt, result);
        verify(mobiTokenVerifier).generateToken("username", SimpleTokenManager.ISSUER, SimpleTokenManager.AUTH_SCOPE, 86400000, null);
    }

    @Test
    public void generateAuthTokenExceptionTest() throws Exception {
        // Setup:
        when(mobiTokenVerifier.generateToken(anyString(), anyString(), anyString(), anyLong(), any())).thenThrow(new JOSEException(""));
        thrown.expect(MobiException.class);

        SignedJWT result = manager.generateAuthToken("username");
        assertEquals(jwt, result);
        verify(mobiTokenVerifier).generateToken("username", SimpleTokenManager.ISSUER, SimpleTokenManager.AUTH_SCOPE, 86400000, null);
    }

    @Test
    public void getTokenStringContextTest() {
        String result = manager.getTokenString(requestContext);
        assertEquals(MOBI_TOKEN, result);
        verify(requestContext).getCookies();
    }

    @Test
    public void getTokenStringContextNoCookieTest() {
        // Setup:
        when(requestContext.getCookies()).thenReturn(new HashMap<>());

        String result = manager.getTokenString(requestContext);
        assertNull(result);
        verify(requestContext).getCookies();
    }

    @Test
    public void getTokenStringRequestTest() {
        String result = manager.getTokenString(servletRequest);
        assertEquals(MOBI_TOKEN, result);
        verify(servletRequest).getCookies();
    }

    @Test
    public void getTokenStringRequestNoCookieTest() {
        // Setup:
        when(servletRequest.getCookies()).thenReturn(new Cookie[] {});

        String result = manager.getTokenString(servletRequest);
        assertNull(result);
        verify(servletRequest).getCookies();
    }

    @Test
    public void createSecureTokenCookieTest() {
        Cookie result = manager.createSecureTokenCookie(jwt);
        assertEquals(SimpleTokenManager.TOKEN_NAME, result.getName());
        assertEquals(MOBI_TOKEN, result.getValue());
        assertTrue(result.getSecure());
        assertEquals("/", result.getPath());
    }

    @Test
    public void createSecureTokenNewCookieTest() {
        NewCookie result = manager.createSecureTokenNewCookie(jwt);
        assertEquals(SimpleTokenManager.TOKEN_NAME, result.getName());
        assertEquals(MOBI_TOKEN, result.getValue());
        assertTrue(result.isSecure());
        assertEquals("/", result.getPath());
    }
}
