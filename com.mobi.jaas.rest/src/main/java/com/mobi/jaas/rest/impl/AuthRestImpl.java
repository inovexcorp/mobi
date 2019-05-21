package com.mobi.jaas.rest.impl;

/*-
 * #%L
 * com.mobi.jaas.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.principals.UserPrincipal;
import com.mobi.jaas.api.utils.TokenUtils;
import com.mobi.jaas.rest.AuthRest;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.MobiWebException;
import com.mobi.web.security.util.RestSecurityUtils;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.security.Principal;
import java.text.ParseException;
import java.util.List;
import java.util.Optional;
import java.util.StringTokenizer;
import java.util.stream.Collectors;
import javax.security.auth.Subject;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class AuthRestImpl implements AuthRest {

    static final String REQUIRED_ROLE = "user";

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

    private EngineManager engineManager;
    private MobiConfiguration configuration;

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setConfiguration(MobiConfiguration configuration) {
        this.configuration = configuration;
    }

    @Override
    public Response getCurrentUser(ContainerRequestContext context) {
        String token = TokenUtils.getTokenString(context);
        try {
            Optional<SignedJWT> tokenOptional = TokenUtils.verifyToken(token);
            if (tokenOptional.isPresent()) {
                log.debug("Token found and verified.");
                log.debug("Writing payload to response.");
                SignedJWT signedToken = tokenOptional.get();
                return Response.ok(signedToken.getPayload().toString()).build();
            } else {
                log.debug("Token missing or unverified. Generating unauthenticated token.");
                SignedJWT signedToken = TokenUtils.generateUnauthToken();
                log.debug("Writing payload to response.");
                return createResponse(signedToken);
            }
        } catch (ParseException ex) {
            throw handleParseError(ex);
        } catch (JOSEException ex) {
            throw handleJOSEError(ex);
        } catch (IOException ex) {
            throw handleIOError(ex);
        }
    }

    @Override
    public Response login(ContainerRequestContext context, String username, String password) {
        Optional<UserCredentials> userCredsOptional = processFormAuth(username, password);

        if (!userCredsOptional.isPresent()) {
            log.debug("Could not find creds from Form Auth. Trying BASIC Auth...");

            userCredsOptional = processBasicAuth(context);
            if (!userCredsOptional.isPresent()) {
                log.debug("Could not find creds from BASIC Auth.");
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }
        }

        UserCredentials userCreds = userCredsOptional.get();
        log.debug("Attempting to login in as " + username);
        try {
            if (authenticated(userCreds.getUsername(), userCreds.getPassword())) {
                SignedJWT token = TokenUtils.generateauthToken(userCreds.getUsername());
                log.debug("Authentication successful.");
                return createResponse(token);
            }
            log.debug("Authentication failed.");
            return Response.status(Response.Status.UNAUTHORIZED).build();
        } catch (JOSEException ex) {
            throw handleJOSEError(ex);
        } catch (IOException ex) {
            throw handleIOError(ex);
        }
    }

    @Override
    public Response logout(ContainerRequestContext containerRequestContext) {
        log.debug("Requested logout. Generating unauthenticated token.");
        try {
            SignedJWT unauthToken = TokenUtils.generateUnauthToken();
            return createResponse(unauthToken);
        } catch (JOSEException ex) {
            throw handleJOSEError(ex);
        } catch (IOException ex) {
            throw handleIOError(ex);
        }
    }

    private Response createResponse(SignedJWT token) {
        log.debug("Writing payload to response.");
        return Response.ok(token.getPayload().toString())
                .cookie(TokenUtils.createSecureTokenNewCookie(token)).build();
    }

    private boolean authenticated(String username, String password) {
        return doAuthenticate(username, password).isPresent();
    }

    private Optional<UserCredentials> processBasicAuth(ContainerRequestContext context) {
        String authzHeader = context.getHeaderString("Authorization");

        if (authzHeader == null) {
            log.debug("No authorization header.");
            return Optional.empty();
        }

        String encodedUsernameAndPassword = authzHeader.replaceAll("Basic ", "");
        String usernameAndPassword = new String(Base64.decodeBase64(encodedUsernameAndPassword.getBytes()));

        StringTokenizer tokenizer = new StringTokenizer(usernameAndPassword, ":");
        if (tokenizer.countTokens() < 2) {
            log.debug("Missing authorization information.");
            return Optional.empty();
        }
        String username = tokenizer.nextToken();
        String password = tokenizer.nextToken();

        return Optional.of(new UserCredentials(username, password));
    }

    private Optional<UserCredentials> processFormAuth(String username, String password) {
        if (StringUtils.isNotEmpty(username) && StringUtils.isNotEmpty(password)) {
            return Optional.of(new UserCredentials(username, password));
        }
        return Optional.empty();
    }

    private Optional<Subject> doAuthenticate(final String username, final String password) {
        Subject subject = new Subject();

        if (!RestSecurityUtils.authenticateUser("mobi", subject, username, password, configuration)) {
            return Optional.empty();
        }

        log.debug("Authentication successful, retrieving UserPrincipals");
        List<Principal> principals = subject.getPrincipals().stream()
                .filter(p -> p instanceof UserPrincipal)
                .collect(Collectors.toList());
        if (principals.isEmpty()) {
            log.debug("No UserPrincipals found");
            return Optional.empty();
        }
        boolean found = false;
        for (Role role : engineManager.getUserRoles(principals.get(0).getName())) {
            if (role.getResource().stringValue().contains(REQUIRED_ROLE)) {
                found = true;
                break;
            }
        }
        if (!found) {
            log.debug("User does not have the required role " + REQUIRED_ROLE);
            return Optional.empty();
        }
        log.debug("User has required role");
        return Optional.of(subject);
    }

    private static class UserCredentials {
        private String username;
        private String password;

        UserCredentials(String username, String password) {
            this.username = username;
            this.password = password;
        }

        public String getPassword() {
            return password;
        }

        public String getUsername() {
            return username;
        }
    }

    private MobiWebException handleIOError(IOException ex) {
        return handleError("Problem Creating JWT Token", ex);
    }

    private MobiWebException handleJOSEError(JOSEException ex) {
        return handleError("Problem Creating or Verifying JWT Token", ex);
    }

    private MobiWebException handleParseError(ParseException ex) {
        return handleError("Problem Parsing JWT Token", ex);
    }

    private MobiWebException handleError(String msg, Exception ex) {
        log.error(msg, ex);
        return ErrorUtils.sendError(msg, Response.Status.INTERNAL_SERVER_ERROR);
    }
}
