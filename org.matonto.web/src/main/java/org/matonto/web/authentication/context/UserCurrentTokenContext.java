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
import org.apache.log4j.Logger;
import org.matonto.jaas.api.utils.TokenUtils;
import org.matonto.web.authentication.AuthHttpContext;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;

public class UserCurrentTokenContext extends AuthHttpContext {

    private final Logger log = Logger.getLogger(this.getClass().getName());

    @Override
    protected boolean handleAuth(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String token = TokenUtils.getTokenString(request);
        Optional<SignedJWT> tokenOptional = TokenUtils.verifyToken(token, response);

        if (tokenOptional.isPresent()) {
            log.debug("Token found and verified. Writing payload to response.");
            TokenUtils.writePayload(response, tokenOptional.get());
            return true;
        } else {
            log.debug("Token missing or unverified. Generating unauthenticated token.");
            SignedJWT unauthToken = TokenUtils.generateUnauthToken(response);
            response.addCookie(TokenUtils.createSecureTokenCookie(unauthToken));

            log.debug("Writing payload to response.");
            TokenUtils.writePayload(response, unauthToken);

            return true;
        }
    }

    @Override
    protected void handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }
}
