package com.mobi.web.authentication.context;


import com.nimbusds.jwt.SignedJWT;
import org.apache.commons.codec.binary.Base64;
import com.mobi.jaas.api.utils.TokenUtils;
import com.mobi.web.authentication.AuthHttpContext;
import com.mobi.web.authentication.utils.UserCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class UserLoginTokenContext extends AuthHttpContext {

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

    @Override
    protected boolean handleAuth(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Optional<UserCredentials> userCredsOptional = processFormAuth(request);

        if (!userCredsOptional.isPresent()) {
            log.debug("Could not find creds from Form Auth. Trying BASIC Auth...");

            userCredsOptional = processBasicAuth(request);
            if (!userCredsOptional.isPresent()) {
                log.debug("Could not find creds from BASIC Auth.");
                return false;
            }
        }

        UserCredentials userCreds = userCredsOptional.get();

        if (authenticated(request, userCreds.getUsername(), userCreds.getPassword())) {
            SignedJWT token = TokenUtils.generateauthToken(response, userCreds.getUsername());
            response.addCookie(TokenUtils.createSecureTokenCookie(token));

            TokenUtils.writePayload(response, token);

            log.debug("Authentication successful.");
            return true;
        }
        log.debug("Authentication failed.");
        return false;
    }

    @Override
    protected void handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }

    private Optional<UserCredentials> processFormAuth(HttpServletRequest request) {
        String username = request.getParameter("username");
        String password = request.getParameter("password");

        if (username != null && password != null) {
            return Optional.of(new UserCredentials(username, password));
        }
        return Optional.empty();
    }

    private Optional<UserCredentials> processBasicAuth(HttpServletRequest request) {
        String authzHeader = request.getHeader("Authorization");

        if (authzHeader == null) {
            log.debug("No authorization header.");
            return Optional.empty();
        }

        String usernameAndPassword = new String(Base64.decodeBase64(authzHeader.substring(6).getBytes()));

        int userNameIndex = usernameAndPassword.indexOf(":");
        String username = usernameAndPassword.substring(0, userNameIndex);
        String password = usernameAndPassword.substring(userNameIndex + 1);

        return Optional.of(new UserCredentials(username, password));
    }
}
