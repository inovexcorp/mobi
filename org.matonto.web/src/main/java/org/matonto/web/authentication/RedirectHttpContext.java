package org.matonto.web.authentication;

import org.apache.log4j.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class RedirectHttpContext extends AuthHttpContext {

    private static final String REDIRECT_PATH = "/matonto/login.html";

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    protected boolean handleNoAuthHeader(HttpServletRequest req, HttpServletResponse res) throws IOException {
        log.debug("No authorization header. Redirecting to " + REDIRECT_PATH);
        res.sendRedirect(REDIRECT_PATH);
        return false;
    }

    @Override
    protected boolean handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        log.debug("Authorization Denied. Redirecting to " + REDIRECT_PATH);
        res.sendRedirect(REDIRECT_PATH);
        return false;
    }
}
