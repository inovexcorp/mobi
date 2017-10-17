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

import com.mobi.jaas.api.engines.EngineManager;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import com.mobi.jaas.api.config.LoginModuleConfig;
import com.mobi.jaas.api.principals.UserPrincipal;
import com.mobi.jaas.api.utils.TokenUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.text.ParseException;
import java.util.Map;
import java.util.Optional;
import javax.security.auth.Subject;
import javax.security.auth.callback.Callback;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.login.FailedLoginException;
import javax.security.auth.login.LoginException;
import javax.security.auth.spi.LoginModule;

public class TokenLoginModule implements LoginModule {

    private static final Logger LOG = LoggerFactory.getLogger(TokenLoginModule.class.getName());
    private EngineManager engineManager;
    private String engineName;
    private Subject subject;
    private CallbackHandler callbackHandler;
    private String userId;

    @Override
    public void initialize(Subject subject, CallbackHandler callbackHandler,
                           Map<String, ?> sharedState, Map<String, ?> options) {
        this.subject = subject;
        this.callbackHandler = callbackHandler;
        engineManager = (EngineManager) options.get(LoginModuleConfig.ENGINE_MANAGER);
        engineName = options.get(LoginModuleConfig.ENGINE) + "";
        LOG.debug("Initialized TokenLoginModule engineName=" + engineName);
    }

    @Override
    public boolean login() throws LoginException {
        LOG.debug("Verifying token...");

        if (!engineManager.containsEngine(engineName)) {
            String msg = "Engine " + engineName + " is not registered with SimpleEngineManager";
            LOG.debug(msg);
            throw new LoginException(msg);
        }

        Callback[] callbacks = new Callback[1];
        callbacks[0] = new TokenCallback();

        try {
            callbackHandler.handle(callbacks);
        } catch (IOException ioe) {
            LOG.debug(ioe.getMessage());
            throw new LoginException(ioe.getMessage());
        } catch (UnsupportedCallbackException uce) {
            String msg = uce.getMessage() + " not available to obtain information from user";
            LOG.debug(msg);
            throw new LoginException(msg);
        }

        String tokenString = ((TokenCallback) callbacks[0]).getTokenString();
        if (tokenString == null) {
            String msg = "Unable to retrieve token string";
            LOG.debug(msg);
            throw new FailedLoginException(msg);
        }

        Optional<SignedJWT> tokenOptional;
        try {
            tokenOptional = TokenUtils.verifyToken(tokenString);
        } catch (ParseException e) {
            String msg = "Problem parsing JWT";
            LOG.debug(msg);
            throw new FailedLoginException(msg);
        } catch (JOSEException e) {
            String msg = "Problem verifying JWT";
            LOG.debug(msg);
            throw new FailedLoginException(msg);
        }

        if (!tokenOptional.isPresent()) {
            String msg = "Token not verified";
            LOG.debug(msg);
            throw new FailedLoginException(msg);
        }

        LOG.debug("Token found and verified.");
        SignedJWT token = tokenOptional.get();

        String user;
        try {
            user = token.getJWTClaimsSet().getSubject();
        } catch (ParseException e) {
            String msg = "Problem parsing JWT";
            LOG.debug(msg);
            throw new FailedLoginException(msg);
        }

        if (!engineManager.userExists(engineName, user)) {
            throw new FailedLoginException("User " + user + " does not exist");
        }

        this.userId = user;
        LOG.debug("Successfully logged in " + user);
        return true;
    }

    @Override
    public boolean commit() throws LoginException {
        if (this.userId != null) {
            this.subject.getPrincipals().add(new UserPrincipal(this.userId));
            return true;
        }

        return false;
    }

    @Override
    public boolean abort() throws LoginException {
        this.userId = null;
        LOG.debug("Abort");
        return true;
    }

    @Override
    public boolean logout() throws LoginException {
        subject.getPrincipals().remove(new UserPrincipal(this.userId));
        this.userId = null;
        LOG.debug("Logout");
        return true;
    }
}
