package com.mobi.jaas.token;

/*-
 * #%L
 * com.mobi.jaas
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

import org.osgi.service.component.annotations.Component;
import com.mobi.jaas.api.token.TokenVerifier;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.SecureRandom;
import java.text.ParseException;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import javax.annotation.Nullable;

@Component(immediate = true, service = {MobiTokenVerifier.class, TokenVerifier.class})
public class MobiTokenVerifier implements TokenVerifier {

    public static final String NAME = "MobiVerifier";

    // Generate random 256-bit (32-byte) shared secret
    private static final SecureRandom random = new SecureRandom();
    private static final byte[] KEY = new byte[32];

    static {
        random.nextBytes(KEY);
    }

    private static final Logger LOG = LoggerFactory.getLogger(MobiTokenVerifier.class.getName());

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public Optional<SignedJWT> verifyToken(String tokenString) throws ParseException, JOSEException  {
        if (tokenString == null) {
            return Optional.empty();
        }

        try {
            SignedJWT signedJWT = SignedJWT.parse(tokenString);
            JWSVerifier verifier = new MACVerifier(padKey(KEY));

            // Verify Token
            if (signedJWT.verify(verifier)) {
                return Optional.of(signedJWT);
            } else {
                return Optional.empty();
            }
        } catch (ParseException e) {
            String msg = "Problem Parsing JWT Token";
            LOG.error(msg, e);
            throw e;
        } catch (JOSEException e) {
            String msg = "Problem Creating or Verifying JWT Token";
            LOG.error(msg, e);
            throw e;
        }
    }

    /**
     * Creates a JWT Token String for the user with the provided username using the Mobi token key and the provided
     * issuer, scope, tokenDuration, and additional claims.
     *
     * @param username The sub of the token
     * @param issuer The issuer of the token
     * @param scope The scope of the token
     * @param tokenDuration The duration for the new token
     * @param claims An optional map of custom claims to add to the token
     * @return String representing the encoded and compact JWT Token
     * @throws JOSEException if there is a problem creating the token
     */
    SignedJWT generateToken(String username, String issuer, String scope, long tokenDuration,
                            @Nullable Map<String, Object> claims) throws JOSEException {
        // Create HMAC signer
        JWSSigner signer = new MACSigner(padKey(KEY));

        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + tokenDuration);

        // Prepare JWT Builder with claims set
        JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder()
                .subject(username)
                .issuer(issuer)
                .expirationTime(expirationDate)
                .claim("scope", scope);

        if (claims != null) {
            claims.forEach(builder::claim);
        }

        SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), builder.build());

        // Apply the HMAC protection
        signedJWT.sign(signer);

        return signedJWT;
    }

    /**
     * Pads the provided key to be 256 bits.
     *
     * @param key the byte array to pad
     * @return Padded byte[] with 256 bits
     */
    private static byte[] padKey(byte[] key) {
        if (key.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(key, 0, padded, 32 - key.length, key.length);
            return padded;
        }
        return key;
    }
}
