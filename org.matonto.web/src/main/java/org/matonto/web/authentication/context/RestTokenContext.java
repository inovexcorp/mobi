package org.matonto.web.authentication.context;

import com.nimbusds.jwt.SignedJWT;
import org.apache.log4j.Logger;
import org.matonto.web.authentication.AuthHttpContext;
import org.matonto.web.security.utils.TokenUtils;

import java.io.IOException;
import java.text.ParseException;
import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class RestTokenContext extends AuthHttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    protected boolean handleAuth(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String tokenString = TokenUtils.getTokenString(request);
        Optional<SignedJWT> tokenOptional = TokenUtils.verifyToken(tokenString, response);

        if (tokenOptional.isPresent()) {
            log.debug("Token found and verified.");

            SignedJWT token = tokenOptional.get();

            String scope;
            try {
                scope = token.getJWTClaimsSet().getStringClaim("scope");
            } catch (ParseException e) {
                String msg = "Problem Parsing JWT Token";
                log.error(msg, e);
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, msg);
                return false;
            }

            if (scope.equals(TokenUtils.ANON_SCOPE)) {
                log.debug("Anon user rejected.");
                return false;
            }

            return true;
        } else {
            log.debug("Token missing or unverified. Requesting BASIC authentication.");
            response.setHeader("WWW-Authenticate", "Basic");
            return false;
        }
    }

    @Override
    protected void handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }
}
