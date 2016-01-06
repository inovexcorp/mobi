package org.matonto.web.authentication;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.SecureRandom;
import java.text.ParseException;
import java.util.Date;
import java.util.Optional;

public abstract class AbstractTokenHttpContext extends AuthHttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    // Generate random 256-bit (32-byte) shared secret
    private static final SecureRandom random = new SecureRandom();
    private static final byte[] KEY = new byte[32];

    static {
        random.nextBytes(KEY);
    }

    private static final long ONE_DAY_SEC = 24*60*60;
    private static final long ONE_DAY_MS = ONE_DAY_SEC*1000;
    private static final long TOKEN_DURATION = ONE_DAY_MS;
    private static final String ISSUER = "http://matonto.org/";
    protected static final String ANON_SCOPE = "self anon";
    protected static final String TOKEN_NAME = "matonto_web_token";

    protected abstract boolean handleTokenFound(HttpServletRequest req, HttpServletResponse res, SignedJWT verifiedToken) throws IOException, ParseException, JOSEException;

    protected abstract boolean handleTokenMissing(HttpServletRequest req, HttpServletResponse res) throws IOException, JOSEException;

    @Override
    protected boolean handleAuth(HttpServletRequest req, HttpServletResponse res) throws IOException {
        try {
            String token = getTokenString(req);

            if (token != null) {
                // Token exists
                Optional<SignedJWT> jwtOptional = verifyToken(token);

                if (jwtOptional.isPresent()) {
                    return handleTokenFound(req, res, jwtOptional.get());
                } else {
                    log.debug("Token Failed Verification. Refreshing Unauth Token.");
                    SignedJWT unauthToken = generateUnauthToken(req);
                    res.addCookie(createSecureTokenCookie(unauthToken));
                    return true;
                }
            } else {
                return handleTokenMissing(req, res);
            }
        } catch (ParseException e) {
            String msg = "Problem Parsing JWT Token";
            log.error(msg, e);
            res.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, msg);
        } catch (JOSEException e) {
            String msg = "Problem Creating or Verifying JWT Token";
            log.error(msg, e);
            res.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, msg);
        }

        return false;
    }

    @Override
    protected void handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        log.debug("Authorization Denied.");
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }

    protected String getTokenString(HttpServletRequest req) {
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

    protected Optional<SignedJWT> verifyToken(String tokenString) throws ParseException, JOSEException {
        SignedJWT signedJWT = SignedJWT.parse(tokenString);
        JWSVerifier verifier = new MACVerifier(KEY);

        // Verify Token
        if (signedJWT.verify(verifier)) {
            return Optional.of(signedJWT);
        } else {
            return Optional.empty();
        }
    }

    protected Optional<SignedJWT> generateTokenUsingFormAuth(HttpServletRequest req) throws JOSEException {
        // Check for login parameters
        String username = req.getParameter("username");
        String password = req.getParameter("password");

        if (username != null && password != null) {
            // Check value of parameters
            log.debug("Login params found.");
            boolean authenticated =  authenticated(req, username, password);

            if (authenticated) {
                log.debug("Login params authenticated.");
                return Optional.of(createJWT(username, "/*"));
            }
        }

        return Optional.empty();
    }

    protected Optional<SignedJWT> generateTokenUsingBasicAuth(HttpServletRequest req) throws JOSEException {
        req.setAttribute(AUTHENTICATION_TYPE, HttpServletRequest.BASIC_AUTH);

        String authzHeader = req.getHeader("Authorization");

        if (authzHeader == null) {
            log.debug("No authorization header.");
            return Optional.empty();
        }

        String usernameAndPassword = new String(Base64.decodeBase64(authzHeader.substring(6).getBytes()));

        int userNameIndex = usernameAndPassword.indexOf(":");
        String username = usernameAndPassword.substring(0, userNameIndex);
        String password = usernameAndPassword.substring(userNameIndex + 1);

        if (authenticated(req, username, password)) {
            log.debug("Basic Auth authenticated.");
            return Optional.of(createJWT(username, "/*"));
        } else {
            return Optional.empty();
        }
    }

    protected SignedJWT generateUnauthToken(HttpServletRequest req) throws JOSEException {
        log.debug("Creating unauth token.");
        return createJWT("anon", ANON_SCOPE);
    }

    protected Cookie createSecureTokenCookie(SignedJWT signedJWT) {
        Cookie cookie = new Cookie(TOKEN_NAME, signedJWT.serialize());
        cookie.setSecure(true);

        return cookie;
    }

    /**
     * Creates a JWT Token String.
     *
     * @param username The sub of the token
     * @param scope The scope of the token
     * @return The String representing the encoded and compact JWT Token
     * @throws JOSEException if there is a problem creating the token
     */
    private SignedJWT createJWT(String username, String scope) throws JOSEException {
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
