package com.mobi.web.security.jaxrs.provider;

/*-
 * #%L
 * com.mobi.web.security
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

/**
 * The {@link AuthorizationHandler} is part of the security provider and needs to be registered as an OSGi service.
 * Clients may implement the {@link AuthorizationHandler#isUserInRole(Principal, String)} method to authorize a
 * specific user. The {@link Principal} used to call this method will be taken from the {@link AuthenticationHandler}.
 *
 * @see AuthenticationHandler
 */
public interface AuthorizationHandler {

    /**
     * Determines whether or not the requesting user is in the specified role.
     *
     * @param user the user requesting access.
     * @param role the role protecting the access.
     * @return true if the user is in the role or false otherwise
     *
     * @see AuthenticationHandler
     */
    boolean isUserInRole(Principal user, String role);

}
