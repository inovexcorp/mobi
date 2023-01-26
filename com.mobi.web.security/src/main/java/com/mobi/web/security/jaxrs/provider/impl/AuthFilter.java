package com.mobi.web.security.jaxrs.provider.impl;

/*-
 * #%L
 * com.mobi.web.security
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.web.security.jaxrs.provider.AuthenticationHandler;
import com.mobi.web.security.jaxrs.provider.AuthorizationHandler;
import com.mobi.web.security.util.api.SecurityHelper;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.component.annotations.ServiceScope;

import java.lang.reflect.Method;
import java.security.Principal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import javax.annotation.Priority;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Priorities;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.ext.Provider;

@Provider
@Component(scope = ServiceScope.PROTOTYPE, property = {
        "osgi.jaxrs.extension=true"
})
@Priority(Priorities.AUTHENTICATION - 1)
public class AuthFilter implements ContainerRequestFilter {

    @Context
    protected ResourceInfo resourceInfo;

    @Reference
    protected AuthenticationHandler authenticationHandler;

    @Reference
    protected AuthorizationHandler authorizationHandler;

    private Map<String, SecurityHelper> helpers = new HashMap<>();

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    void addSecurityHelper(SecurityHelper helper) {
        helpers.put(helper.getClass().getSimpleName(), helper);
    }

    void removeSecurityHelper(SecurityHelper helper) {
        helpers.remove(helper.getClass().getSimpleName());
    }

    @Override
    public void filter(ContainerRequestContext requestContext) {
        Method method = resourceInfo.getResourceMethod();
        Principal principal = authenticationHandler.authenticate(requestContext);
        if (method.isAnnotationPresent(RolesAllowed.class)) {
            if (principal == null) {
                requestContext.abortWith(Response.status(Response.Status.FORBIDDEN).build());
            } else {
                setSecurityContext(principal, requestContext);
                Set<String> annotatedRoles = new HashSet<>(
                        Arrays.asList(method.getAnnotation(RolesAllowed.class).value()));
                boolean userAllowed = isUserAllowed(annotatedRoles, principal);
                if (!userAllowed) {
                    requestContext.abortWith(Response.status(Response.Status.FORBIDDEN).build());
                }
            }
        } else if (principal != null) {
            setSecurityContext(principal, requestContext);
        }
    }

    private void setSecurityContext(Principal principal, ContainerRequestContext requestContext) {
        SecurityContext securityContext = new SecurityContextImpl(
                this.authenticationHandler.getAuthenticationScheme(),
                principal,
                requestContext.getUriInfo().getRequestUri().getScheme().equals("https"),
                authorizationHandler);
        requestContext.setSecurityContext(securityContext);
    }

    private boolean isUserAllowed(Set<String> annotatedRoles, Principal principal) {
        for (SecurityHelper helper : helpers.values()) {
            for (String role : annotatedRoles) {
                if (helper.isUserInRole(principal, role)) {
                    return true;
                }
            }
        }
        return false;
    }
}
