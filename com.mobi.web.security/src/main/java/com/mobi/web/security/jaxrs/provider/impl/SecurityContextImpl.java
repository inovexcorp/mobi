package com.mobi.web.security.jaxrs.provider.impl;

/*-
 * #%L
 * com.mobi.web.security
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.web.security.jaxrs.provider.AuthorizationHandler;

import java.security.Principal;
import javax.ws.rs.core.SecurityContext;

public class SecurityContextImpl implements SecurityContext {

    private final boolean secure;
    private final String authenticationScheme;
    private final Principal principal;
    private final AuthorizationHandler authorizationHandler;

    public SecurityContextImpl(String authenticationScheme, Principal principal, boolean secure,
                               AuthorizationHandler authorizationHandler ) {
        this.authenticationScheme = authenticationScheme;
        this.principal = principal;
        this.secure = secure;
        this.authorizationHandler = authorizationHandler;
    }

    @Override
    public String getAuthenticationScheme() {
        return authenticationScheme;
    }

    @Override
    public Principal getUserPrincipal() {
        return principal;
    }

    @Override
    public boolean isSecure() {
        return secure;
    }

    @Override
    public boolean isUserInRole(String role) {
        if (authorizationHandler != null) {
            return authorizationHandler.isUserInRole(principal, role);
        }
        return false;
    }
}
