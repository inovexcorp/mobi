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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.jaas.api.token.TokenVerifier;
import com.mobi.jaas.config.SimpleTokenConfig;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.NewCookie;

@Component(
        immediate = true,
        configurationPolicy = ConfigurationPolicy.optional,
        designateFactory = SimpleTokenConfig.class,
        name = SimpleTokenManager.COMPONENT_NAME
)
public class SimpleTokenManager implements TokenManager {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleTokenManager.class.getName());
    static final String TOKEN_NAME = "mobi_web_token";
    static final String COMPONENT_NAME = "com.mobi.jaas.SimpleTokenManager";

    private static final long ONE_DAY_SEC = 24 * 60 * 60;
    private static final long ONE_DAY_MS = ONE_DAY_SEC * 1000;
    private long tokenDuration;
    static final String ISSUER = "http://mobi.com/";
    static final String ANON_SCOPE = "self anon";
    static final String AUTH_SCOPE = "self /*";

    private MobiTokenVerifier mobiTokenVerifier;

    private Map<String, TokenVerifier> verifiers = new HashMap<>();

    @Reference
    void setMobiTokenVerifier(MobiTokenVerifier mobiTokenVerifier) {
        this.mobiTokenVerifier = mobiTokenVerifier;
    }

    @Reference(type = '*', dynamic = true)
    void addVerifier(TokenVerifier verifier) {
        verifiers.put(verifier.getName(), verifier);
    }

    void removeVerifier(TokenVerifier verifier) {
        verifiers.remove(verifier.getName());
    }

    @Activate
    public void start(Map<String, Object> props) {
        SimpleTokenConfig config = Configurable.createConfigurable(SimpleTokenConfig.class, props);
        if (Long.valueOf(config.tokenDurationMins()) > 0) {
            LOG.debug("Token duration was set to: " + config.tokenDurationMins() + " mins");
            tokenDuration = config.tokenDurationMins() * 60 * 1000;
        } else {
            LOG.debug("Token duration was invalid, setting token duration to default of 1 day");
            tokenDuration = ONE_DAY_MS;
        }
    }

    @Modified
    public void modified(Map<String, Object> props) {
        start(props);
    }

    @Override
    public Optional<SignedJWT> verifyToken(String tokenString) {
        for (TokenVerifier verifier : verifiers.values()) {
            LOG.debug("Verifying Token with " + verifier.getName());
            try {
                Optional<SignedJWT> signedJWT = verifier.verifyToken(tokenString);
                if (signedJWT.isPresent()) {
                    LOG.debug("Token verified with " + verifier.getName());
                    return signedJWT;
                } else {
                    LOG.debug("Token could not be verified with " + verifier.getName());
                }
            } catch (Exception ex) {
                LOG.debug("Token could not be verified with " + verifier.getName());
            }
        }
        return Optional.empty();
    }

    @Override
    public SignedJWT generateUnauthToken() {
        try {
            return mobiTokenVerifier.generateToken("anon", ISSUER, ANON_SCOPE, tokenDuration, null);
        } catch (JOSEException e) {
            String msg = "Problem Creating JWT Token";
            LOG.error(msg, e);
            throw new MobiException(e);
        }
    }

    @Override
    public SignedJWT generateAuthToken(String username) {
        try {
            return mobiTokenVerifier.generateToken(username, ISSUER, AUTH_SCOPE, tokenDuration, null);
        } catch (JOSEException e) {
            String msg = "Problem Creating JWT Token";
            LOG.error(msg, e);
            throw new MobiException(e);
        }
    }

    @Override
    public String getTokenString(ContainerRequestContext requestContext) {
        javax.ws.rs.core.Cookie cookie = requestContext.getCookies().get(TOKEN_NAME);

        if (cookie == null) {
            LOG.debug("Mobi web token cookie not found.");
            return null;
        } else {
            return cookie.getValue();
        }
    }

    @Override
    public String getTokenString(HttpServletRequest servletRequest) {
        Cookie[] cookies = servletRequest.getCookies();

        // Check for existing login cookie
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(TOKEN_NAME)) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }

    @Override
    public Cookie createSecureTokenCookie(SignedJWT token) {
        Cookie cookie = new Cookie(TOKEN_NAME, token.serialize());
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge((int) (tokenDuration / 1000));

        return cookie;
    }

    @Override
    public NewCookie createSecureTokenNewCookie(SignedJWT token) {
        return new NewCookie(TOKEN_NAME, token.serialize(), "/", null, null, (int) (tokenDuration / 1000), true);
    }
}
