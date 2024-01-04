package com.mobi.web.security.jaxrs.provider;

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

import java.security.Principal;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.SecurityContext;

/**
 * The {@link AuthenticationHandler} is part of the security provider and needs to be registered as an OSGi service.
 * Client may implement this interface to perform user authentication and to define an authentication scheme.
 * These values will be used later on in a {@link SecurityContext} that is used by the framework to verify
 * authentication. An {@link AuthenticationHandler} may be used together with an {@link AuthorizationHandler}.
 */
public interface AuthenticationHandler {

    /**
     * Authenticates the user initiating the request. Implementations must return null if the
     * user could not be authenticated.
     *
     * @param requestContext the request context supplied by the underlying JAX-RS implementation.
     * @return a principal representing the authenticated user initiating the request or null if
     *         the user could not be authenticated.
     */
    Principal authenticate(ContainerRequestContext requestContext);

    /**
     * @return the authentication scheme.
     */
    String getAuthenticationScheme();
}
