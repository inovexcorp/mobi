package com.mobi.jaas.api.modules.token;

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

import com.mobi.jaas.api.config.LoginModuleConfig;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.token.TokenManager;
import com.nimbusds.jwt.SignedJWT;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.ParseException;
import java.util.Map;
import java.util.Optional;
import javax.security.auth.Subject;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.login.FailedLoginException;
import javax.security.auth.login.LoginException;

public class SimpleTokenLoginModule extends TokenLoginModule<TokenCallback> {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleTokenLoginModule.class);
    private String engineName;
    private EngineManager engineManager;
    private TokenManager tokenManager;

    @Override
    protected TokenCallback[] getCallbacks() {
        return new TokenCallback[] {
                new TokenCallback()
        };
    }

    @Override
    protected Optional<SignedJWT> verifyToken(TokenCallback callback) {
        return tokenManager.verifyToken(callback.getTokenString());
    }

    @Override
    protected void verifyUser(String user, TokenCallback callback) throws LoginException {
        if (!engineManager.userExists(user)) {
            throw new FailedLoginException("User " + user + " does not exist");
        }
    }

    @Override
    protected String getUsername(SignedJWT signedJWT) throws LoginException {
        try {
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (ParseException e) {
            String msg = "Problem parsing JWT";
            LOG.debug(msg);
            throw new FailedLoginException(msg);
        }
    }

    @Override
    public void initialize(Subject subject, CallbackHandler handler, Map<String, ?> state, Map<String, ?> options) {
        super.initialize(subject, handler, state, options);
        engineManager = (EngineManager) options.get(LoginModuleConfig.ENGINE_MANAGER);
        tokenManager = (TokenManager) options.get(TOKEN_MANAGER);
        LOG.debug("Initialized SimpleTokenLoginModule");
    }
}
