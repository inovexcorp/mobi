package org.matonto.web.authentication;

import org.apache.log4j.Logger;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Performs Form Authentication.
 */
public class FormHttpContext extends AuthHttpContext {

    private static final String LOGIN_PAGE = "/matonto/login.html";

    private final Logger log = Logger.getLogger(this.getClass().getName());

    private static final String USER_NAME = "matonto_web_username";
    private static final String PASS_NAME = "matonto_web_password";

    private static final int MAX_AGE_MINS = 15;

    @Override
    protected boolean handleAuth(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String username = null;
        String password = null;

        Cookie[] cookies = req.getCookies();

        // Check for existing login cookie
        if (cookies != null) {
            for (Cookie cookie : req.getCookies()) {
                if (cookie.getName().equals(USER_NAME)) {
                    username = cookie.getValue();
                } else if (cookie.getName().equals(PASS_NAME)) {
                    password = cookie.getValue();
                }
            }
        }

        if (username != null && password != null) {
            // Check value of cookie
            log.debug("Login cookie found.");
            return authenticated(req, username, password);
        }

        // Check for login parameters
        username = req.getParameter("username");
        password = req.getParameter("password");

        if (username != null && password != null) {
            // Check value of parameters
            log.debug("Login params found.");
            boolean authenticated =  authenticated(req, username, password);

            if (authenticated) {
                Cookie userCookie = new Cookie(USER_NAME, username);
                userCookie.setMaxAge(MAX_AGE_MINS * 60);

                Cookie passCookie = new Cookie(PASS_NAME, password);
                passCookie.setMaxAge(MAX_AGE_MINS * 60);

                res.addCookie(userCookie);
                res.addCookie(passCookie);
            }

            return authenticated;
        }

        return false;
    }

    @Override
    protected void handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        log.debug("Authorization Denied. Redirecting to " + LOGIN_PAGE);
        res.sendRedirect(LOGIN_PAGE);
    }
}
