package org.matonto.web.authentication.utils;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.apache.log4j.Logger;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.SecureRandom;
import java.text.ParseException;
import java.util.Date;
import java.util.Optional;

public class TokenUtils {

    private static final Logger LOG = Logger.getLogger(TokenUtils.class.getName());

    // Generate random 256-bit (32-byte) shared secret
    private static final SecureRandom random = new SecureRandom();
    private static final byte[] KEY = new byte[32];

    static {
        random.nextBytes(KEY);
    }

    private static final String TOKEN_NAME = "matonto_web_token";

    private static final long ONE_DAY_SEC = 24*60*60;
    private static final long ONE_DAY_MS = ONE_DAY_SEC*1000;
    private static final long TOKEN_DURATION = ONE_DAY_MS;
    private static final String ISSUER = "http://matonto.org/";
    private static final String ANON_SCOPE = "self anon";
    private static final String AUTH_SCOPE = "self /*";

    // Attribute set if token verification occurs
    public static final String TOKEN_VERIFICATION_FAILED = "org.matonto.attribute.verificationFailed";
    public static final String VERIFIED_TOKEN = "org.matonto.attribute.verifiedToken";

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

        return cookie;
    }

    public static void writePayload(HttpServletResponse response, SignedJWT token) throws IOException {
        String payload = token.getPayload().toString();
        response.getWriter().write(payload);
        response.getWriter().flush();
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
