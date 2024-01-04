package com.mobi.web.security.util.impl;

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

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.principals.UserPrincipal;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.web.security.util.RestSecurityUtils;
import com.mobi.web.security.util.api.SecurityHelper;

import java.security.Principal;
import javax.security.auth.Subject;
import javax.ws.rs.container.ContainerRequestContext;

@Component(immediate = true)
public class SimpleSecurityHelper implements SecurityHelper {

    @Reference
    MobiConfiguration configuration;

    @Reference
    EngineManager engineManager;

    @Reference
    TokenManager tokenManager;

    @Override
    public boolean authenticate(ContainerRequestContext context, Subject subject) {
        String tokenString = tokenManager.getTokenString(context);
        return RestSecurityUtils.authenticateToken("mobi", subject, tokenString, configuration);
    }

    @Override
    public boolean isUserInRole(Principal principal, String role) {
        if (principal instanceof UserPrincipal) {
            for (Role roleObj : engineManager.getUserRoles(principal.getName())) {
                if (roleObj.getResource().stringValue().contains(role)) {
                    return true;
                }
            }
        }
        return false;
    }
}
