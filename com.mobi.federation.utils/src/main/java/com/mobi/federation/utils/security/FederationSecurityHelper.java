package com.mobi.federation.utils.security;

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

import static com.mobi.web.security.util.RestSecurityUtils.authenticateCommon;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.federation.api.FederationService;
import com.mobi.federation.utils.api.jaas.token.FederationTokenCallback;
import com.mobi.federation.utils.api.jaas.token.config.FederationConfiguration;
import com.mobi.jaas.api.principals.UserPrincipal;
import com.mobi.jaas.api.utils.TokenUtils;
import com.mobi.web.security.util.api.SecurityHelper;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import javax.security.auth.Subject;
import javax.security.auth.callback.Callback;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.login.Configuration;
import javax.ws.rs.container.ContainerRequestContext;

@Component(immediate = true)
public class FederationSecurityHelper implements SecurityHelper {

    protected FederationConfiguration configuration;
    private Map<String, FederationService> serviceMap = new HashMap<>();

    @Reference
    protected void setFederationConfiguration(FederationConfiguration configuration) {
        this.configuration = configuration;
    }

    @Reference(type = '*', dynamic = true)
    void addFederationService(FederationService federationService) {
        String federationId = federationService.getFederationServiceConfig().id();
        serviceMap.put(federationId, federationService);
    }

    void removeFederationService(FederationService federationService) {
        String federationId = federationService.getFederationServiceConfig().id();
        serviceMap.remove(federationId);
    }

    @Override
    public boolean authenticate(ContainerRequestContext context, Subject subject) {
        String tokenString = TokenUtils.getTokenString(context);
        String federationId = context.getProperty("federationId") + "";
        String nodeId = context.getProperty("nodeId") + "";

        return serviceMap.containsKey(federationId) && authenticateToken(subject, tokenString, configuration,
                serviceMap.get(federationId), nodeId);
    }

    @Override
    public boolean isUserInRole(Principal principal, String role) {
        return principal instanceof UserPrincipal && role.equals("remote-user");
    }

    private boolean authenticateToken(Subject subject, String tokenString, Configuration configuration,
                                      FederationService service, String nodeId) {
        return authenticateCommon("mobi-federation", subject, callbacks -> {
            for (Callback callback : callbacks) {
                if (callback instanceof FederationTokenCallback) {
                    ((FederationTokenCallback) callback).setTokenString(tokenString);
                    ((FederationTokenCallback) callback).setService(service);
                    ((FederationTokenCallback) callback).setNodeId(nodeId);
                } else {
                    throw new UnsupportedCallbackException(callback);
                }
            }
        }, configuration);
    }
}
