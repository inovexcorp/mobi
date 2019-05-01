package com.mobi.jaas.api.utils;

/*-
 * #%L
 * com.mobi.jaas.api
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

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.security.SecureRandom;
import java.text.ParseException;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import javax.annotation.Nullable;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.NewCookie;

public class TokenUtils {
    private static final Logger LOG = LoggerFactory.getLogger(TokenUtils.class.getName());

    // Generate random 256-bit (32-byte) shared secret
    private static final SecureRandom random = new SecureRandom();
    private static final byte[] KEY = new byte[32];

    static {
        random.nextBytes(KEY);
    }

    private static final String TOKEN_NAME = "mobi_web_token";

    private static final long ONE_DAY_SEC = 24 * 60 * 60;
    private static final long ONE_DAY_MS = ONE_DAY_SEC * 1000;
    private static final long TOKEN_DURATION = ONE_DAY_MS;
    private static final String ISSUER = "http://mobi.com/";
    private static final String ANON_SCOPE = "self anon";
    private static final String AUTH_SCOPE = "self /*";

    // Attribute set if token verification occurs
    public static final String TOKEN_VERIFICATION_FAILED = "com.mobi.attribute.verificationFailed";
    public static final String VERIFIED_TOKEN = "com.mobi.attribute.verifiedToken";

    /**
     * Returns the encoded, compact string that represents the JWT Token.
     *
     * @param req The HttpServletRequest
     * @return The encoded, compact string that represents the JWT Token
     */
    public static String getTokenString(HttpServletRequest req) {
        Cookie[] cookies = req.getCookies();

        // Check for existing login cookie
        if (cookies != null) {
            for (Cookie cookie : req.getCookies()) {
                if (cookie.getName().equals(TOKEN_NAME)) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }

    public static String getTokenString(ContainerRequestContext req) {
        javax.ws.rs.core.Cookie cookie = req.getCookies().get(TOKEN_NAME);

        if (cookie == null) {
            LOG.debug("Mobi web token cookie not found.");
            return null;
        } else {
            return cookie.getValue();
        }
    }

    public static Optional<SignedJWT> verifyToken(String tokenString) throws ParseException, JOSEException {
        return verifyToken(tokenString, KEY);
    }

    public static Optional<SignedJWT> verifyToken(String tokenString, byte[] key) throws ParseException, JOSEException {
        if (tokenString == null) {
            return Optional.empty();
        }

        SignedJWT signedJWT = SignedJWT.parse(tokenString);
        JWSVerifier verifier = new MACVerifier(padKey(key));

        // Verify Token
        if (signedJWT.verify(verifier)) {
            return Optional.of(signedJWT);
        } else {
            return Optional.empty();
        }
    }

    public static Optional<SignedJWT> verifyToken(String tokenString, HttpServletResponse res) throws IOException {
        return verifyToken(tokenString, res, KEY);
    }

    public static Optional<SignedJWT> verifyToken(String tokenString, HttpServletResponse res, byte[] key)
            throws IOException {
        if (tokenString == null) {
            return Optional.empty();
        }

        try {
            SignedJWT signedJWT = SignedJWT.parse(tokenString);
            JWSVerifier verifier = new MACVerifier(padKey(key));

            // Verify Token
            if (signedJWT.verify(verifier)) {
                return Optional.of(signedJWT);
            } else {
                return Optional.empty();
            }
        } catch (ParseException e) {
            String msg = "Problem Parsing JWT Token";
            LOG.error(msg, e);
            res.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, msg);
        } catch (JOSEException e) {
            String msg = "Problem Creating or Verifying JWT Token";
            LOG.error(msg, e);
            res.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, msg);
        }

        return Optional.empty();
    }

    public static SignedJWT generateUnauthToken(HttpServletResponse res) throws IOException {
        return generateToken(res, "anon", ANON_SCOPE, KEY, null);
    }

    public static SignedJWT generateUnauthToken() throws IOException, JOSEException {
        return generateToken("anon", ANON_SCOPE, KEY, null);
    }

    public static SignedJWT generateauthToken(HttpServletResponse res, String username) throws IOException {
        return generateToken(res, username, AUTH_SCOPE, KEY, null);
    }

    public static SignedJWT generateauthToken(String username) throws IOException, JOSEException {
        return generateToken(username, AUTH_SCOPE, KEY, null);
    }

    public static Cookie createSecureTokenCookie(SignedJWT signedJWT) {
        Cookie cookie = new Cookie(TOKEN_NAME, signedJWT.serialize());
        cookie.setSecure(true);
        cookie.setPath("/");

        return cookie;
    }

    public static NewCookie createSecureTokenNewCookie(SignedJWT signedJWT) {
        return new NewCookie(TOKEN_NAME, signedJWT.serialize(), "/", "", "", -1, true);
    }

    public static void writePayload(HttpServletResponse response, SignedJWT token) throws IOException {
        String payload = token.getPayload().toString();
        response.getWriter().write(payload);
        response.getWriter().flush();
        response.setContentType(MediaType.APPLICATION_JSON);
    }

    public static SignedJWT generateToken(HttpServletResponse res, String username, String scope, byte[] key,
                                          @Nullable Map<String, Object> claims) throws IOException {
        SignedJWT authToken = null;
        try {
            authToken = createJWT(username, scope, key, claims);
        } catch (JOSEException e) {
            String msg = "Problem Creating JWT Token";
            LOG.error(msg, e);
            res.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, msg);
        }

        return authToken;
    }

    public static SignedJWT generateToken(String username, String scope, byte[] key,
                                          @Nullable Map<String, Object> claims) throws IOException, JOSEException {
        return createJWT(username, scope, key, claims);
    }

    /**
     * Creates a JWT Token String.
     *
     * @param username The sub of the token
     * @param scope The scope of the token
     * @param key The key (or secret) of the token
     * @param customClaims The map of custom claims to add to the token
     * @return The String representing the encoded and compact JWT Token
     * @throws JOSEException if there is a problem creating the token
     */
    private static SignedJWT createJWT(String username, String scope, byte[] key, Map<String, Object> customClaims)
            throws JOSEException {
        // Create HMAC signer
        JWSSigner signer = new MACSigner(padKey(key));

        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + TOKEN_DURATION);

        // Prepare JWT Builder with claims set
        JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder()
                .subject(username)
                .issuer(ISSUER)
                .expirationTime(expirationDate)
                .claim("scope", scope);

        if (customClaims != null) {
            customClaims.forEach(builder::claim);
        }

        SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), builder.build());

        // Apply the HMAC protection
        signedJWT.sign(signer);

        return signedJWT;
    }

    /**
     * Pads the provided key to be 256 bits.
     *
     * @param key the byte array to pad
     * @return Padded byte[] with 256 bits
     */
    private static byte[] padKey(byte[] key) {
        if (key.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(key, 0, padded, 32 - key.length, key.length);
            return padded;
        }
        return key;
    }
}