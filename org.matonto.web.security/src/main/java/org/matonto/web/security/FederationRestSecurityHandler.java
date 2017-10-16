package org.matonto.web.security;

/*-
 * #%L
 * org.matonto.web.security
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
import org.matonto.federation.api.FederationService;
import org.matonto.jaas.api.config.MatontoConfiguration;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.Role;
import org.matonto.jaas.api.principals.UserPrincipal;
import org.matonto.jaas.api.utils.TokenUtils;
import org.matonto.web.security.util.AuthenticationProps;
import org.matonto.web.security.util.RestSecurityUtils;
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

    protected MatontoConfiguration matOntoConfiguration;
    protected EngineManager engineManager;
    private Map<String, FederationService> federationServiceMap = new HashMap<>();

    @Reference
    protected void setMatOntoConfiguration(MatontoConfiguration configuration) {
        this.matOntoConfiguration = configuration;
    }

    @Reference
    protected void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
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

        if (federationServiceMap.containsKey(federationId) && !RestSecurityUtils.authenticateToken("matonto", subject,
                tokenString, matOntoConfiguration, federationServiceMap.get(federationId))) {
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

    // TODO: update this to use the federation user utils
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
