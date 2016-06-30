package org.matonto.web.authentication.context;

/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.nimbusds.jwt.SignedJWT;
import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;
import org.matonto.jaas.utils.TokenUtils;
import org.matonto.web.authentication.AuthHttpContext;
import org.matonto.web.authentication.utils.UserCredentials;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;

public class UserLoginTokenContext extends AuthHttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    protected boolean handleAuth(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Optional<UserCredentials> userCredsOptional;

        userCredsOptional = processFormAuth(request);

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
        } else {
            log.debug("Authentication failed.");
            return false;
        }
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
        } else {
            return Optional.empty();
        }
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
