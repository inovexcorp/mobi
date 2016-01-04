package org.matonto.web.authentication;

import org.apache.log4j.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class HeaderHttpContext extends AuthHttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    protected boolean handleNoAuthHeader(HttpServletRequest req, HttpServletResponse res) throws IOException {
        log.debug("No authorization header. Requesting Authentication");
        res.setHeader("WWW-Authenticate", "MatOnto_Web");
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
        return false;
    }

    @Override
    protected boolean handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        log.debug("Authorization Denied.");
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
        return false;
    }
}
