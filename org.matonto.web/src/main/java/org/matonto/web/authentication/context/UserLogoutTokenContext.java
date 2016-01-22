package org.matonto.web.authentication.context;

import com.nimbusds.jwt.SignedJWT;
import org.apache.log4j.Logger;
import org.matonto.web.authentication.AuthHttpContext;
import org.matonto.web.authentication.utils.TokenUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class UserLogoutTokenContext extends AuthHttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    protected boolean handleAuth(HttpServletRequest request, HttpServletResponse response) throws IOException {
        log.debug("Requested logout. Generating unauthenticated token.");
        SignedJWT unauthToken = TokenUtils.generateUnauthToken(response);
        response.addCookie(TokenUtils.createSecureTokenCookie(unauthToken));

        TokenUtils.writePayload(response, unauthToken);

        return true;
    }

    @Override
    protected void handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }
}
