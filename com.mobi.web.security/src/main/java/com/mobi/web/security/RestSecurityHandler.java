package com.mobi.web.security;

/*-
 * #%L
 * com.mobi.web.security
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
import com.mobi.jaas.api.principals.UserPrincipal;
import com.mobi.web.security.util.AuthenticationProps;
import com.mobi.web.security.util.api.SecurityHelper;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Principal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.security.auth.Subject;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.SecurityContext;

@Component(immediate = true)
public class RestSecurityHandler implements AuthenticationHandler, AuthorizationHandler {
    private static final Logger LOG = LoggerFactory.getLogger(RestSecurityHandler.class);

    private Map<String, SecurityHelper> helpers = new HashMap<>();

    @Reference(type = '*', dynamic = true)
    void addSecurityHelper(SecurityHelper helper) {
        helpers.put(helper.getClass().getSimpleName(), helper);
    }

    void removeSecurityHelper(SecurityHelper helper) {
        helpers.remove(helper.getClass().getSimpleName());
    }

    @Override
    public Principal authenticate(ContainerRequestContext containerRequestContext) {
        Subject subject = new Subject();
        boolean authenticated = false;
        String className = "";

        for (SecurityHelper helper : helpers.values()) {
            if (helper.authenticate(containerRequestContext, subject)) {
                className = helper.getClass().getSimpleName();
                LOG.debug("Authenticated using " + className);
                authenticated = true;
                break;
            }
        }

        if (!authenticated) {
            LOG.debug("Not authenticated using: " + StringUtils.join(helpers, ", "));
            return null;
        }

        List<Principal> principals = subject.getPrincipals().stream()
                .filter(p -> p instanceof UserPrincipal)
                .collect(Collectors.toList());
        if (principals.isEmpty()) {
            LOG.debug("No UserPrincipals found.");
            return null;
        }
        Principal principal = principals.get(0);
        containerRequestContext.setProperty(AuthenticationProps.USERNAME, principal.getName());
        return new UserPrincipal(principal.getName(), className);
    }

    @Override
    public String getAuthenticationScheme() {
        return SecurityContext.BASIC_AUTH;
    }

    @Override
    public boolean isUserInRole(Principal principal, String role) {
        return principal instanceof UserPrincipal
                && helpers.get(((UserPrincipal) principal).getClassName()).isUserInRole(principal, role);
    }
}
