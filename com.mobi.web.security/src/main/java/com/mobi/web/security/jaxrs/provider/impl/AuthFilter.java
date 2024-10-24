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

/**
 * This class implements a JAX-RS container request filter to handle
 * authentication and authorization for incoming HTTP requests. It checks
 * if a request has the appropriate credentials and user roles based on the
 * annotations in the resource method, aborting the request if the user
 * is not allowed to proceed.
 *
 * <p>This filter is registered as an OSGi component with prototype scope,
 * which means that a new instance is created each time it's used. The
 * authentication and authorization handlers are injected via OSGi services.
 * Multiple {@link SecurityHelper} instances can be dynamically added or removed
 * to check user roles.
 *
 * <p>The filter operates at a priority just below authentication.
 *
 * @see ContainerRequestFilter
 * @see AuthenticationHandler
 * @see AuthorizationHandler
 */
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

    private final Map<String, SecurityHelper> helpers = new HashMap<>();

    /**
     * Adds a {@link SecurityHelper} dynamically to the filter. The helper
     * is added to a map, where it can be used to check if a user is in a
     * specific role.
     *
     * @param helper the {@link SecurityHelper} to add
     */
    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    void addSecurityHelper(SecurityHelper helper) {
        helpers.put(helper.getClass().getSimpleName(), helper);
    }

    /**
     * Removes a {@link SecurityHelper} dynamically from the filter.
     *
     * @param helper the {@link SecurityHelper} to remove
     */
    void removeSecurityHelper(SecurityHelper helper) {
        helpers.remove(helper.getClass().getSimpleName());
    }

    /**
     * Filters incoming requests to perform authentication and authorization checks.
     *
     * <p>The method retrieves the resource method being accessed, authenticates the user,
     * and checks if the method has a {@link RolesAllowed} annotation. If roles are specified,
     * the method verifies whether the user has the required roles. If the user is not authenticated
     * or does not have the necessary roles, the request is aborted with an appropriate status code.
     *
     * <p>If the method does not require specific roles, the principal (authenticated user) is
     * still set in the security context if present.
     *
     * @param requestContext the container request context that holds request data
     */
    @Override
    public void filter(ContainerRequestContext requestContext) {
        Method method = resourceInfo.getResourceMethod();
        Principal principal = authenticationHandler.authenticate(requestContext);
        if (method.isAnnotationPresent(RolesAllowed.class)) {
            if (principal == null) {
                // If the user is not authenticated, abort with a 401 Unauthorized status.
                requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED).build());
            } else {
                setSecurityContext(principal, requestContext);
                Set<String> annotatedRoles = new HashSet<>(
                        Arrays.asList(method.getAnnotation(RolesAllowed.class).value()));
                boolean userAllowed = isUserAllowed(annotatedRoles, principal);
                if (!userAllowed) {
                    // If the user does not have the required roles, abort with a 403 Forbidden status.
                    requestContext.abortWith(Response.status(Response.Status.FORBIDDEN).build());
                }
            }
        } else if (principal != null) {
            // No roles are required and the user is authenticated
            setSecurityContext(principal, requestContext);
        }
    }

    /**
     * Sets the security context for the request using the provided principal.
     * This ensures that subsequent authorization checks can use the authenticated
     * user's details.
     *
     * @param principal the authenticated user principal
     * @param requestContext the container request context
     */
    private void setSecurityContext(Principal principal, ContainerRequestContext requestContext) {
        SecurityContext securityContext = new SecurityContextImpl(
                this.authenticationHandler.getAuthenticationScheme(),
                principal,
                requestContext.getUriInfo().getRequestUri().getScheme().equals("https"),
                authorizationHandler);
        requestContext.setSecurityContext(securityContext);
    }

    /**
     * Checks if the authenticated user is allowed to access the resource method.
     * This is done by verifying if the user's roles match any of the roles in
     * the {@link RolesAllowed} annotation.
     *
     * @param annotatedRoles the set of roles allowed to access the method
     * @param principal the authenticated user principal
     * @return true if the user is allowed, false otherwise
     */
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