package com.mobi.web.security.util.impl;

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

import org.apache.commons.codec.binary.Base64;
import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.principals.UserPrincipal;
import com.mobi.web.security.util.RestSecurityUtils;
import com.mobi.web.security.util.api.SecurityHelper;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Principal;
import java.util.StringTokenizer;
import javax.security.auth.Subject;
import javax.ws.rs.container.ContainerRequestContext;

@Component(immediate = true)
public class BasicAuthSecurityHelper implements SecurityHelper {

    private static final String AUTHORIZATION_PROPERTY = "Authorization";
    private static final String AUTHENTICATION_SCHEME = "Basic";

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

    @Reference
    EngineManager engineManager;

    @Reference
    MobiConfiguration configuration;

    @Override
    public boolean authenticate(ContainerRequestContext context, Subject subject) {
        String authzHeader = context.getHeaderString(AUTHORIZATION_PROPERTY);

        if (authzHeader == null) {
            log.debug("No authorization header.");
            return false;
        }

        String encodedUsernameAndPassword = authzHeader.replaceAll(AUTHENTICATION_SCHEME + " ", "");
        String usernameAndPassword = new String(Base64.decodeBase64(encodedUsernameAndPassword.getBytes()));

        StringTokenizer tokenizer = new StringTokenizer(usernameAndPassword, ":");
        if (tokenizer.countTokens() < 2) {
            log.debug("Missing authorization information.");
            return false;
        }
        String username = tokenizer.nextToken();
        String password = tokenizer.nextToken();

        return RestSecurityUtils.authenticateUser("mobi", subject, username, password, configuration);
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
