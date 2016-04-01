package org.matonto.web.authentication.context;

import com.nimbusds.jwt.SignedJWT;
import org.apache.log4j.Logger;
import org.matonto.web.authentication.AuthHttpContext;
import org.matonto.web.authentication.utils.TokenUtils;

import java.io.IOException;
import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class UITokenContext extends AuthHttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    protected boolean handleAuth(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String token = TokenUtils.getTokenString(request);
        Optional<SignedJWT> tokenOptional = TokenUtils.verifyToken(token, response);

        if (tokenOptional.isPresent()) {
            log.debug("Token found and verified.");
            return true;
        } else {
            log.debug("Token missing or unverified. Generating unauthenticated token.");
            SignedJWT unauthToken = TokenUtils.generateUnauthToken(response);
            response.addCookie(TokenUtils.createSecureTokenCookie(unauthToken));
            return true;
        }
    }

    @Override
    protected void handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }
}
