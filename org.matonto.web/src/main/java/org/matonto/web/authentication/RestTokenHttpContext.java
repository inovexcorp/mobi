package org.matonto.web.authentication;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import org.apache.log4j.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.ParseException;
import java.util.Optional;

public class RestTokenHttpContext extends AbstractTokenHttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    protected boolean handleTokenFound(HttpServletRequest req, HttpServletResponse res, SignedJWT verifiedToken) throws IOException, ParseException, JOSEException {
        String scope = verifiedToken.getJWTClaimsSet().getStringClaim("scope");
        return !scope.equals(ANON_SCOPE);
    }

    @Override
    protected boolean handleTokenMissing(HttpServletRequest req, HttpServletResponse res) throws IOException, JOSEException {
        // Check for BASIC Auth
        if (req.getHeader("Authorization") == null) {
            log.debug("No authorization header. Requesting Authentication");
            res.setHeader("WWW-Authenticate", "MatOnto_Web");
            return false;
        }

        // Perform BASIC Auth
        Optional<SignedJWT> basicToken = generateTokenUsingBasicAuth(req);
        if (basicToken.isPresent()) {
            res.addCookie(createSecureTokenCookie(basicToken.get()));
            return true;
        }

        log.debug("BASIC Auth Failed.");
        return false;
    }
}
