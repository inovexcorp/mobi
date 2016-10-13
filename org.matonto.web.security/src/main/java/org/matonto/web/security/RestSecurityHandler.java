package org.matonto.web.security;

/*-
 * #%L
 * org.matonto.web.security
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.eclipsesource.jaxrs.provider.security.AuthenticationHandler;
import com.eclipsesource.jaxrs.provider.security.AuthorizationHandler;
import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.jaas.boot.principal.RolePrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.apache.log4j.Logger;
import org.matonto.jaas.utils.TokenUtils;
import org.matonto.web.security.util.RestSecurityUtils;

import javax.security.auth.Subject;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.SecurityContext;
import java.security.Principal;
import java.util.Set;
import java.util.stream.Collectors;

@Component(immediate = true)
public class RestSecurityHandler implements AuthenticationHandler, AuthorizationHandler {

    private static final Logger LOG = Logger.getLogger(RestSecurityHandler.class.getName());

    protected JaasRealm realm;
    private final static String ROLE_CLASS = "org.apache.karaf.jaas.boot.principal.RolePrincipal";

    @Reference(target = "(realmId=matonto)")
    protected void setRealm(JaasRealm realm) {
        this.realm = realm;
    }

    @Override
    public Principal authenticate(ContainerRequestContext containerRequestContext) {
        Subject subject = new Subject();
        String tokenString = TokenUtils.getTokenString(containerRequestContext);

        if (!RestSecurityUtils.authenticateToken(realm.getName(), subject, tokenString)) {
            return null;
        }

        Set<String> roles = subject.getPrincipals().stream()
                .filter(p -> p.getClass().getName().equals(ROLE_CLASS))
                .map(Principal::getName)
                .collect(Collectors.toSet());

        // Return all roles as comma separated String because this security provider forces us
        // to return a Principal instead of a Subject. Lame.
        return new RolePrincipal(StringUtils.join(roles, ","));
    }

    @Override
    public String getAuthenticationScheme() {
        return SecurityContext.BASIC_AUTH;
    }

    @Override
    public boolean isUserInRole(Principal principal, String role) {
        if (principal.getClass().getName().equals(ROLE_CLASS)) {
            for (String userRole : principal.getName().split(",")) {
                if (userRole.equals(role)) {
                    return true;
                }
            }
        }

        return false;
    }
}
