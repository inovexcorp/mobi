package com.mobi.jaas.rest;

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

import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.principals.UserPrincipal;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.MobiWebException;
import com.mobi.rest.util.RestUtils;
import com.mobi.web.security.util.RestSecurityUtils;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.lang3.StringUtils;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
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
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = AuthRest.class, immediate = true)
@Path("/session")
public class AuthRest {

    static final String REQUIRED_ROLE = "user";

    private final Logger log = LoggerFactory.getLogger(this.getClass().getName());

    private EngineManager engineManager;
    private MobiConfiguration configuration;
    private TokenManager tokenManager;

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setConfiguration(MobiConfiguration configuration) {
        this.configuration = configuration;
    }

    @Reference
    void setTokenManager(TokenManager tokenManager) {
        this.tokenManager = tokenManager;
    }

    /**
     * Retrieves the current User username as a plaintext response. If there is no User session, returns an empty
     * response representing an anonymous User session.
     *
     * @return a plaintext response with the current User's username
     */
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    @Operation(
            tags = "session",
            summary = "Gets the current user token.",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A plaintext response with the current User's username"),
            }
    )
    public Response getCurrentUser(
            @Context ContainerRequestContext context) {
        Optional<String> optUsername = RestUtils.optActiveUsername(context);
        if (optUsername.isPresent()) {
            log.debug("Found username in request headers");
            return Response.ok(optUsername.get()).build();
        } else {
            log.debug("No username found in request headers. Generating unauthenticated token.");
            SignedJWT signedToken = tokenManager.generateUnauthToken();
            return createResponse(signedToken, null);
        }
    }

    /**
     * Attempts to login to Mobi using the provided username and password and create a new session. If successful,
     * returns the new User username as a plaintext response.
     *
     * @return a plaintext response with the newly logged in User's username
     */
    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @Operation(
            tags = "session",
            summary = "Logs in into Mobi creating a new token.",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A plaintext response with the newly logged in User's username"),
                    @ApiResponse(responseCode = "401", description = "UNAUTHORIZED response"),
            }
    )
    public Response login(
            @Context ContainerRequestContext context,
            @Parameter(description = "Username of user", required = true)
            @QueryParam("username") String username,
            @Parameter(description = "password of user",
                    schema = @Schema(type = "string", format = "password"), required = true)
            @QueryParam("password") String password) {
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
        if (authenticated(userCreds.getUsername(), userCreds.getPassword())) {
            User user = engineManager.retrieveUser(userCreds.getUsername()).orElseThrow(() ->
                    new IllegalStateException("User " + userCreds.getUsername() + " not found and should be present"));
            SignedJWT token = tokenManager.generateAuthToken(user.getUsername()
                    .orElseThrow(() -> new IllegalStateException("User must have username")).stringValue());
            log.debug("Authentication successful.");
            return createResponse(token, userCreds.getUsername());
        }
        log.debug("Authentication failed.");
        return Response.status(Response.Status.UNAUTHORIZED).build();
    }

    /**
     * Logs out of Mobi by removing the current User session. Returns an empty response representing an anonymous User
     * session.
     *
     * @return an empty response representing an anonymous User's session
     */
    @DELETE
    @Produces(MediaType.TEXT_PLAIN)
    @Operation(
            tags = "session",
            summary = "Logs out of Mobi by setting unauth token.",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "An empty response representing an anonymous User's session"),
            }
    )
    public Response logout() {
        log.debug("Requested logout. Generating unauthenticated token.");
        SignedJWT unauthToken = tokenManager.generateUnauthToken();
        return createResponse(unauthToken, null);
    }

    private Response createResponse(SignedJWT token, String username) {
        log.debug("Setting token in response.");
        Response.ResponseBuilder builder;
        if (username != null) {
            builder = Response.ok(username);
        } else {
            builder = Response.ok();
        }
        return builder.cookie(tokenManager.createSecureTokenNewCookie(token)).build();
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
