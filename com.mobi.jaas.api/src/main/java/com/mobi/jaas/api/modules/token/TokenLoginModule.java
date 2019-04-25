package com.mobi.jaas.api.modules.token;

/*-
 * #%L
 * com.mobi.jaas.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import com.mobi.jaas.api.principals.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.text.ParseException;
import java.util.Map;
import java.util.Optional;
import javax.security.auth.Subject;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.login.FailedLoginException;
import javax.security.auth.login.LoginException;
import javax.security.auth.spi.LoginModule;

public abstract class TokenLoginModule<T extends TokenCallback> implements LoginModule {

    private static final Logger LOG = LoggerFactory.getLogger(TokenLoginModule.class);
    private Subject subject;
    private CallbackHandler callbackHandler;
    private String userId;

    protected abstract T[] getCallbacks();

    protected abstract Optional<SignedJWT> verifyToken(T callback) throws ParseException, JOSEException;

    protected abstract void verifyUser(String user, T callback) throws LoginException;

    @Override
    public void initialize(Subject subject, CallbackHandler handler, Map<String, ?> state, Map<String, ?> options) {
        this.subject = subject;
        this.callbackHandler = handler;
    }

    @Override
    public boolean login() throws LoginException {
        LOG.debug("Verifying token...");

        T[] callbacks = getCallbacks();

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

        String tokenString = callbacks[0].getTokenString();
        if (tokenString == null) {
            String msg = "Unable to retrieve token string";
            LOG.debug(msg);
            throw new FailedLoginException(msg);
        }

        Optional<SignedJWT> tokenOptional;
        try {
            tokenOptional = verifyToken(callbacks[0]);
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

        verifyUser(user, callbacks[0]);

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
        LOG.debug("Abort Token Login");
        return true;
    }

    @Override
    public boolean logout() throws LoginException {
        subject.getPrincipals().remove(new UserPrincipal(this.userId));
        this.userId = null;
        LOG.debug("Logout from TokenLoginModule");
        return true;
    }
}
