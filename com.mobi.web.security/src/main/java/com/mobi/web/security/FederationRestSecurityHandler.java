package com.mobi.web.security;

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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.eclipsesource.jaxrs.provider.security.AuthenticationHandler;
import com.eclipsesource.jaxrs.provider.security.AuthorizationHandler;
import com.mobi.federation.api.FederationService;
import com.mobi.federation.api.jaas.token.config.FederationConfiguration;
import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.principals.UserPrincipal;
import com.mobi.jaas.api.utils.TokenUtils;
import com.mobi.web.security.util.AuthenticationProps;
import com.mobi.web.security.util.RestSecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.security.auth.Subject;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.SecurityContext;

@Component(immediate = true)
public class FederationRestSecurityHandler implements AuthenticationHandler, AuthorizationHandler {
    private static final Logger LOG = LoggerFactory.getLogger(RestSecurityHandler.class.getName());

    protected FederationConfiguration configuration;
    private Map<String, FederationService> federationServiceMap = new HashMap<>();

    @Reference
    protected void setFederationConfiguration(FederationConfiguration configuration) {
        this.configuration = configuration;
    }

    @Reference(type = '*', dynamic = true)
    void addFederationService(FederationService federationService) {
        String federationId = federationService.getFederationServiceConfig().id();
        federationServiceMap.put(federationId, federationService);
    }

    void removeFederationService(FederationService federationService) {
        String federationId = federationService.getFederationServiceConfig().id();
        federationServiceMap.remove(federationId);
    }

    @Override
    public Principal authenticate(ContainerRequestContext containerRequestContext) {
        Subject subject = new Subject();
        String tokenString = TokenUtils.getTokenString(containerRequestContext);
        String federationId = containerRequestContext.getProperty("federationId") + "";
        String nodeId = containerRequestContext.getProperty("nodeId") + "";

        if (federationServiceMap.containsKey(federationId) && !RestSecurityUtils.authenticateToken("mobi-federation",
                subject, tokenString, configuration, federationServiceMap.get(federationId), nodeId)) {
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
        return principal;
    }

    @Override
    public String getAuthenticationScheme() {
        return SecurityContext.BASIC_AUTH;
    }

    @Override
    public boolean isUserInRole(Principal principal, String role) {
        return principal instanceof UserPrincipal && role.equals("remote-user");
    }
}
