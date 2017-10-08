package com.mobi.jaas.api.utils;

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
import java.util.Optional;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.MediaType;

public class TokenUtils {
    private static final Logger LOG = LoggerFactory.getLogger(TokenUtils.class.getName());

    // Generate random 256-bit (32-byte) shared secret
    private static final SecureRandom random = new SecureRandom();
    private static final byte[] KEY = new byte[32];

    static {
        random.nextBytes(KEY);
    }

    private static final String TOKEN_NAME = "matonto_web_token";

    private static final long ONE_DAY_SEC = 24 * 60 * 60;
    private static final long ONE_DAY_MS = ONE_DAY_SEC * 1000;
    private static final long TOKEN_DURATION = ONE_DAY_MS;
    private static final String ISSUER = "http://mobi.com/";
    public static final String ANON_SCOPE = "self anon";
    public static final String AUTH_SCOPE = "self /*";

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
            LOG.debug("MatOnto web token cookie not found.");
            return null;
        } else {
            return cookie.getValue();
        }
    }

    public static Optional<SignedJWT> verifyToken(String tokenString) throws ParseException, JOSEException {
        if (tokenString == null) {
            return Optional.empty();
        }

        SignedJWT signedJWT = SignedJWT.parse(tokenString);
        JWSVerifier verifier = new MACVerifier(KEY);

        // Verify Token
        if (signedJWT.verify(verifier)) {
            return Optional.of(signedJWT);
        } else {
            return Optional.empty();
        }
    }

    public static Optional<SignedJWT> verifyToken(String tokenString, HttpServletResponse res) throws IOException {
        if (tokenString == null) {
            return Optional.empty();
        }

        try {
            SignedJWT signedJWT = SignedJWT.parse(tokenString);
            JWSVerifier verifier = new MACVerifier(KEY);

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
        SignedJWT unauthToken = null;
        try {
            unauthToken = createJWT("anon", ANON_SCOPE);
        } catch (JOSEException e) {
            String msg = "Problem Creating JWT Token";
            LOG.error(msg, e);
            res.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, msg);
        }

        return unauthToken;
    }

    public static SignedJWT generateauthToken(HttpServletResponse res, String username) throws IOException {
        SignedJWT authToken = null;
        try {
            authToken = createJWT(username, AUTH_SCOPE);
        } catch (JOSEException e) {
            String msg = "Problem Creating JWT Token";
            LOG.error(msg, e);
            res.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, msg);
        }

        return authToken;
    }

    public static Cookie createSecureTokenCookie(SignedJWT signedJWT) {
        Cookie cookie = new Cookie(TOKEN_NAME, signedJWT.serialize());
        cookie.setSecure(true);
        cookie.setPath("/");

        return cookie;
    }

    public static void writePayload(HttpServletResponse response, SignedJWT token) throws IOException {
        String payload = token.getPayload().toString();
        response.getWriter().write(payload);
        response.getWriter().flush();
        response.setContentType(MediaType.APPLICATION_JSON);
    }

    /**
     * Creates a JWT Token String.
     *
     * @param username The sub of the token
     * @param scope The scope of the token
     * @return The String representing the encoded and compact JWT Token
     * @throws JOSEException if there is a problem creating the token
     */
    private static SignedJWT createJWT(String username, String scope) throws JOSEException {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + TOKEN_DURATION);

        // Create HMAC signer
        JWSSigner signer = new MACSigner(KEY);

        // Prepare JWT with claims set
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(username)
                .issuer(ISSUER)
                .expirationTime(expirationDate)
                .claim("scope", scope)
                .build();

        SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);

        // Apply the HMAC protection
        signedJWT.sign(signer);

        return signedJWT;
    }
}
