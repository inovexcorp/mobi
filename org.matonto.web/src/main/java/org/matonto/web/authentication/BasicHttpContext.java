package org.matonto.web.authentication;

import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Performs BASIC Authentication.
 */
public class BasicHttpContext extends AuthHttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    public boolean handleSecurity(HttpServletRequest req, HttpServletResponse res) throws IOException {
        log.debug("Requesting Authorization...");

        // Allow the login page
        if (unsecuredPages.contains(req.getRequestURI())) {
            log.debug("Allowing access to " + req.getRequestURI());
            return true;
        }

        if (req.getHeader("Authorization") == null) {
            log.debug("No authorization header. Requesting Authentication");
            res.setHeader("WWW-Authenticate", "MatOnto_Web");
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }

        if (handleAuth(req, res)) {
            log.debug("Authorization Granted.");
            return true;
        } else {
            return handleAuthDenied(req, res);
        }
    }

    @Override
    protected boolean handleAuth(HttpServletRequest req, HttpServletResponse res) throws IOException {
        req.setAttribute(AUTHENTICATION_TYPE, HttpServletRequest.BASIC_AUTH);

        String authzHeader = req.getHeader("Authorization");
        String usernameAndPassword = new String(Base64.decodeBase64(authzHeader.substring(6).getBytes()));

        int userNameIndex = usernameAndPassword.indexOf(":");
        String username = usernameAndPassword.substring(0, userNameIndex);
        String password = usernameAndPassword.substring(userNameIndex + 1);

        return authenticated(req, username, password);
    }

    @Override
    protected boolean handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        log.debug("Authorization Denied.");
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
        return false;
    }
}
