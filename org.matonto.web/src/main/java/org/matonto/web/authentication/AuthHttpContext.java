package org.matonto.web.authentication;

import org.apache.commons.codec.binary.Base64;
import org.osgi.service.http.HttpContext;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URL;

public class AuthHttpContext implements HttpContext {

    @Override
    public boolean handleSecurity(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if (req.getHeader("Authorization") == null) {
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        if (authenticated(req)) {
            return true;
        } else {
            res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
    }

    protected boolean authenticated(HttpServletRequest request) {
        request.setAttribute(AUTHENTICATION_TYPE, HttpServletRequest.BASIC_AUTH);

        String authzHeader = request.getHeader("Authorization");
        String usernameAndPassword = new String(Base64.decodeBase64(authzHeader.substring(6).getBytes()));

        int userNameIndex = usernameAndPassword.indexOf(":");
        String username = usernameAndPassword.substring(0, userNameIndex);
        String password = usernameAndPassword.substring(userNameIndex + 1);

        // Here I will do lame hard coded credential check. HIGHLY NOT RECOMMENDED!
        boolean success = ((username.equals("admin") && password
                .equals("admin")));
        if (success)
            request.setAttribute(REMOTE_USER, "admin");
        return success;
    }

    @Override
    public URL getResource(String s) {
        return null;
    }

    @Override
    public String getMimeType(String s) {
        return null;
    }
}
