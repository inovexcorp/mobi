package com.mobi.jaas.api.token;

/*-
 * #%L
 * com.mobi.jaas.api
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

import com.nimbusds.jwt.SignedJWT;

import java.util.Optional;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.NewCookie;

public interface TokenManager {

    /**
     * Attempts to verify the provided encoded, compact token string with all configured
     * {@link TokenVerifier TokenVerifiers}. Returns a {@link SignedJWT JWT Token} for the first successful
     * verification. If none can verify the string, returns an {@link Optional#empty()}.
     *
     * @param tokenString An encoded, compact token string
     * @return An {@link Optional} with the verified {@link SignedJWT JWT Token}; otherwise {@link Optional#empty()}
     */
    Optional<SignedJWT> verifyToken(String tokenString);

    /**
     * Generates a unauthenticated {@link SignedJWT JWT Token}.
     *
     * @return A {@link SignedJWT JWT Token} that represents an unauthenticated user.
     */
    SignedJWT generateUnauthToken();

    /**
     * Generates a {@link SignedJWT JWT Token} for the user with the provided username.
     *
     * @return A {@link SignedJWT JWT Token} that represents the user with the provided username.
     */
    SignedJWT generateAuthToken(String username);

    /**
     * Returns the encoded, compact string that represents the Mobi {@link SignedJWT JWT Token} from the provided
     * {@link ContainerRequestContext}.
     *
     * @param requestContext The {@link ContainerRequestContext}
     * @return The encoded, compact string that represents the Mobi {@link SignedJWT JWT Token}
     */
    String getTokenString(ContainerRequestContext requestContext);

    /**
     * Returns the encoded, compact string that represents the Mobi {@link SignedJWT JWT Token} from the provided
     * {@link HttpServletRequest}.
     *
     * @param servletRequest The {@link HttpServletRequest}
     * @return The encoded, compact string that represents the Mobi {@link SignedJWT JWT Token}
     */
    String getTokenString(HttpServletRequest servletRequest);

    /**
     * Creates a Mobi {@link Cookie} for the provided {@link SignedJWT JWT Token}. Used for requests for web resources.
     *
     * @param token A {@link SignedJWT JWT Token} to set in the {@link Cookie}
     * @return A {@link Cookie} with the provided {@link SignedJWT JWT Token}
     */
    Cookie createSecureTokenCookie(SignedJWT token);

    /**
     * Creates a Mobi {@link Cookie} for the provided {@link SignedJWT JWT Token}. Used for REST requests.
     *
     * @param token A {@link SignedJWT JWT Token} to set in the {@link Cookie}
     * @return A {@link Cookie} with the provided {@link SignedJWT JWT Token}
     */
    NewCookie createSecureTokenNewCookie(SignedJWT token);

}
