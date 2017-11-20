package com.mobi.jaas.api.modules.token;

/*-
 * #%L
 * com.mobi.jaas
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
import com.mobi.jaas.api.config.LoginModuleConfig;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.utils.TokenUtils;
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

    @Override
    protected TokenCallback[] getCallbacks() {
        return new TokenCallback[] {
                new TokenCallback()
        };
    }

    @Override
    protected Optional<SignedJWT> verifyToken(TokenCallback callback) throws ParseException, JOSEException {
        return TokenUtils.verifyToken(callback.getTokenString());
    }

    @Override
    protected void verifyUser(String user, TokenCallback callback) throws LoginException {
        if (!engineManager.containsEngine(engineName)) {
            String msg = "Engine " + engineName + " is not registered with SimpleEngineManager";
            LOG.debug(msg);
            throw new LoginException(msg);
        }
        if (!engineManager.userExists(engineName, user)) {
            throw new FailedLoginException("User " + user + " does not exist");
        }
    }

    @Override
    public void initialize(Subject subject, CallbackHandler handler, Map<String, ?> state, Map<String, ?> options) {
        super.initialize(subject, handler, state, options);
        engineName = options.get(LoginModuleConfig.ENGINE) + "";
        engineManager = (EngineManager) options.get(LoginModuleConfig.ENGINE_MANAGER);
        LOG.debug("Initialized SimpleTokenLoginModule engineName=" + engineName);
    }
}
