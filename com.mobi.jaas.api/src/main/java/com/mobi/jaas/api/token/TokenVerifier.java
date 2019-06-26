package com.mobi.jaas.api.token;

/*-
 * #%L
 * com.mobi.jaas.api
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

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;

import java.text.ParseException;
import java.util.Optional;

public interface TokenVerifier {

    /**
     * Returns an identifier name for this verifier.
     *
     * @return A String identifier
     */
    String getName();

    /**
     * Attempts to verify the provided encoded, compact token string. If it cannot be verified, returns an
     * {@link Optional#empty()}.
     *
     * @param tokenString An encoded, compact token string
     * @return An {@link Optional} with the verified {@link SignedJWT JWT Token}; otherwise {@link Optional#empty()}
     * @throws ParseException If the token string cannot be parsed
     * @throws JOSEException If an error occurs when creating or verifying the token string
     */
    Optional<SignedJWT> verifyToken(String tokenString) throws ParseException, JOSEException;
}
