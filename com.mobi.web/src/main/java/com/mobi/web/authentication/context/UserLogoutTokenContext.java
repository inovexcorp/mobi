package com.mobi.web.authentication.context;

/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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


import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.utils.TokenUtils;
import com.nimbusds.jwt.SignedJWT;
import org.ops4j.pax.web.extender.whiteboard.ExtenderConstants;
import org.osgi.framework.BundleContext;
import org.osgi.service.http.HttpContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component(
        provide = { UserLogoutTokenContext.class, HttpContext.class },
        properties = {
                ExtenderConstants.PROPERTY_HTTP_CONTEXT_ID + "=" + UserLogoutTokenContext.CONTEXT_ID
        }
)
public class UserLogoutTokenContext extends AuthHttpContext {

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());
    public static final String CONTEXT_ID = "userLogoutCtxId";

    @Activate
    void setup(BundleContext context) {
        log.trace("Starting UserLogoutTokenContext");
        this.setBundle(context.getBundle());
    }

    @Reference
    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    public void setConfiguration(MobiConfiguration configuration) {
        this.configuration = configuration;
    }

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
