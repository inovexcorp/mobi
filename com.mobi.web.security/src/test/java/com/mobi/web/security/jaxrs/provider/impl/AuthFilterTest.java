package com.mobi.web.security.jaxrs.provider.impl;

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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.web.security.jaxrs.provider.AuthenticationHandler;
import com.mobi.web.security.jaxrs.provider.AuthorizationHandler;
import com.mobi.web.security.util.api.SecurityHelper;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.net.URI;
import java.security.Principal;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

public class AuthFilterTest {
    AutoCloseable closeable;
    AuthFilter filter;

    @Mock
    ResourceInfo resourceInfo;

    @Mock
    AuthenticationHandler authenticationHandler;

    @Mock
    AuthorizationHandler authorizationHandler;

    @Mock
    SecurityHelper securityHelper;

    @Mock
    Principal principal;

    @Mock
    ContainerRequestContext requestContext;

    @Mock
    UriInfo uriInfo;

    @Before
    public void setup() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        filter = new AuthFilter();
        filter.addSecurityHelper(securityHelper);
        filter.authenticationHandler = authenticationHandler;
        filter.authorizationHandler = authorizationHandler;
        filter.resourceInfo = resourceInfo;

        when(resourceInfo.getResourceMethod()).thenReturn(this.getClass().getDeclaredMethod("methodWithRolesAllowed"));
        when(authenticationHandler.authenticate(any())).thenReturn(principal);
        when(securityHelper.isUserInRole(any(), eq("user"))).thenReturn(true);
        when(requestContext.getUriInfo()).thenReturn(uriInfo);
        when(uriInfo.getRequestUri()).thenReturn(new URI("https://mobi.com"));
    }

    @Test
    public void noPrincipalNoRoleAnnotation() throws Exception {
        when(authenticationHandler.authenticate(any())).thenReturn(null);
        when(resourceInfo.getResourceMethod()).thenReturn(this.getClass().getDeclaredMethod("methodWithoutRolesAllowed"));
        filter.filter(requestContext);

        verify(resourceInfo).getResourceMethod();
        verify(authenticationHandler).authenticate(eq(requestContext));
        verify(securityHelper, never()).isUserInRole(any(), eq("user"));
        verify(requestContext, never()).setSecurityContext(any());
        verify(requestContext, never()).abortWith(same(Response.status(Response.Status.FORBIDDEN).build()));
    }

    @Test
    public void noPrincipalRoleAnnotation() {
        when(authenticationHandler.authenticate(any())).thenReturn(null);
        filter.filter(requestContext);

        verify(resourceInfo).getResourceMethod();
        verify(authenticationHandler).authenticate(eq(requestContext));
        verify(securityHelper, never()).isUserInRole(any(), eq("user"));
        verify(requestContext, never()).setSecurityContext(any());
        verify(requestContext).abortWith(any(Response.class));
    }

    @Test
    public void principalNoRoleAnnotation() throws Exception {
        when(resourceInfo.getResourceMethod()).thenReturn(this.getClass().getDeclaredMethod("methodWithoutRolesAllowed"));
        filter.filter(requestContext);

        verify(resourceInfo).getResourceMethod();
        verify(authenticationHandler).authenticate(eq(requestContext));
        verify(securityHelper, never()).isUserInRole(any(), eq("user"));
        verify(requestContext).setSecurityContext(any());
        verify(requestContext, never()).abortWith(any(Response.class));
    }

    @Test
    public void principalRoleAnnotationUserHasRole() {
        filter.filter(requestContext);

        verify(resourceInfo).getResourceMethod();
        verify(authenticationHandler).authenticate(eq(requestContext));
        verify(securityHelper).isUserInRole(any(), eq("user"));
        verify(requestContext).setSecurityContext(any());
        verify(requestContext, never()).abortWith(any(Response.class));
    }

    @Test
    public void principalRoleAnnotationUserDoesNotHaveRole() {
        when(securityHelper.isUserInRole(any(), eq("user"))).thenReturn(false);
        filter.filter(requestContext);

        verify(resourceInfo).getResourceMethod();
        verify(authenticationHandler).authenticate(eq(requestContext));
        verify(securityHelper).isUserInRole(any(), eq("user"));
        verify(requestContext).setSecurityContext(any());
        verify(requestContext).abortWith(any(Response.class));
    }

    @RolesAllowed("user")
    public void methodWithRolesAllowed() {}

    public void methodWithoutRolesAllowed() {}
}
