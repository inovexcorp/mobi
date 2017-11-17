package com.mobi.web.security.util.api;

/*-
 * #%L
 * com.mobi.web.security
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import javax.security.auth.Subject;
import javax.security.auth.login.LoginContext;
import javax.ws.rs.container.ContainerRequestContext;

public interface SecurityHelper {
    /**
     * Authenticates the user initiating the request.
     *
     * @param context the request context supplied by the underlying JAX-RS implementation.
     * @param subject the subject to be associated with the {@link LoginContext}.
     * @return true if the user is authenticated; otherwise, false.
     */
    boolean authenticate(ContainerRequestContext context, Subject subject);

    /**
     * Determines whether or not the requesting user is in the specified role.
     *
     * @param principal the user requesting access.
     * @param role      the role protecting the access.
     * @return true if the user is in the role; otherwise, false
     */
    boolean isUserInRole(Principal principal, String role);
}
