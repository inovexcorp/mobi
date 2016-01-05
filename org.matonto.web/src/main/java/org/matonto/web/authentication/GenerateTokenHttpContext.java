package org.matonto.web.authentication;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import org.apache.log4j.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.ParseException;
import java.util.Optional;

public class GenerateTokenHttpContext extends AbstractTokenHttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    protected boolean handleTokenFound(HttpServletRequest req, HttpServletResponse res, SignedJWT verifiedToken) throws IOException, ParseException, JOSEException {
        String scope = verifiedToken.getJWTClaimsSet().getStringClaim("scope");

        // Returns true if is already an authenticated token
        // Returns true if is unauthenticated and is able to create an authenticated token
        // Else Returns false
        if (scope.equals(ANON_SCOPE)) {
            Optional<SignedJWT> authTokenOptional = createAuthToken(req, res);

            if (authTokenOptional.isPresent()) {
                // Auth succeeded
                SignedJWT authToken = authTokenOptional.get();
                writePayload(res, authToken);
                res.addCookie(createSecureTokenCookie(authToken));
                return true;
            } else {
                // Auth Failed
                return false;
            }
        } else {
            writePayload(res, verifiedToken);
            return true;
        }
    }

    @Override
    protected boolean handleTokenMissing(HttpServletRequest req, HttpServletResponse res) throws IOException, JOSEException {
        Optional<SignedJWT> authTokenOptional = createAuthToken(req, res);

        if (authTokenOptional.isPresent()) {
            res.addCookie(createSecureTokenCookie(authTokenOptional.get()));
            return true;
        } else {
            res.setHeader("WWW-Authenticate", "MatOnto_Web");
            return false;
        }
    }

    private Optional<SignedJWT> createAuthToken(HttpServletRequest req, HttpServletResponse res) throws JOSEException {
        // Get new token from Form Auth
        Optional<SignedJWT> formToken = generateTokenUsingFormAuth(req);
        if (formToken.isPresent()) {
            return formToken;
        }

        log.debug("Form Auth Failed. Trying BASIC Auth.");

        // Get new token from BASIC Auth
        Optional<SignedJWT> basicToken = generateTokenUsingBasicAuth(req);
        if (basicToken.isPresent()) {
            return basicToken;
        }

        log.debug("BASIC Auth Failed.");
        return Optional.empty();
    }

    private void writePayload(HttpServletResponse res, SignedJWT token) throws IOException {
        String payload = token.getPayload().toString();
        res.getWriter().write(payload);
        res.getWriter().flush();
    }
}
