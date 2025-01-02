package com.mobi.web.authentication;

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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


import com.mobi.jaas.api.token.TokenManager;
import com.nimbusds.jwt.SignedJWT;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.http.HttpContext;
import org.osgi.service.http.whiteboard.HttpWhiteboardConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component(
        service = { UITokenContext.class, HttpContext.class },
        property = {
                HttpWhiteboardConstants.HTTP_WHITEBOARD_CONTEXT_NAME + "=" + UITokenContext.CONTEXT_ID
        },
        immediate = true
)
public class UITokenContext extends AuthHttpContext {

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());
    public static final String CONTEXT_ID = "uiCtxId";

    private TokenManager tokenManager;

    @Activate
    void setup(BundleContext context) {
        this.setBundle(context.getBundle());
    }

    @Reference
    void setTokenManager(TokenManager tokenManager) {
        this.tokenManager = tokenManager;
    }

    @Override
    protected boolean handleAuth(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String token = tokenManager.getTokenString(request);
        Optional<SignedJWT> tokenOptional = tokenManager.verifyToken(token);

        if (tokenOptional.isPresent()) {
            log.debug("Token found and verified.");
        } else {
            log.debug("Token missing or unverified. Generating unauthenticated token.");
            SignedJWT unauthToken = tokenManager.generateUnauthToken();
            response.addCookie(tokenManager.createSecureTokenCookie(unauthToken));
        }
        return true;
    }

    @Override
    protected void handleAuthDenied(HttpServletRequest req, HttpServletResponse res) throws IOException {
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }
}
