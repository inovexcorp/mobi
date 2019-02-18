package com.mobi.web.authentication.context;


import com.nimbusds.jwt.SignedJWT;
import com.mobi.jaas.api.utils.TokenUtils;
import com.mobi.web.authentication.AuthHttpContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class UserLogoutTokenContext extends AuthHttpContext {

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

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
