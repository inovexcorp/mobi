package com.mobi.jaas.api.modules.password;

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

import com.mobi.jaas.api.config.LoginModuleConfig;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.principals.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Map;
import javax.security.auth.Subject;
import javax.security.auth.callback.Callback;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.callback.NameCallback;
import javax.security.auth.callback.PasswordCallback;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.login.FailedLoginException;
import javax.security.auth.login.LoginException;
import javax.security.auth.spi.LoginModule;

public class PasswordLoginModule implements LoginModule {
    private static final Logger LOG = LoggerFactory.getLogger(PasswordLoginModule.class.getName());
    private EngineManager engineManager;
    private String engineName;
    private Subject subject;
    private CallbackHandler callbackHandler;
    private String userId;

    @Override
    public void initialize(Subject subject, CallbackHandler callbackHandler, Map<String, ?> sharedState,
                           Map<String, ?> options) {
        this.subject = subject;
        this.callbackHandler = callbackHandler;
        engineManager = (EngineManager) options.get(LoginModuleConfig.ENGINE_MANAGER);
        engineName = options.get(LoginModuleConfig.ENGINE) + "";
        LOG.debug("Initialized PasswordLoginModule engineName=" + engineName);
    }

    @Override
    public boolean login() throws LoginException {
        LOG.debug("Verifying password...");

        if (!engineManager.containsEngine(engineName)) {
            String msg = "Engine " + engineName + " is not registered with SimpleEngineManager";
            LOG.debug(msg);
            throw new LoginException(msg);
        }

        Callback[] callbacks = new Callback[2];
        callbacks[0] = new NameCallback("Username: ");
        callbacks[1] = new PasswordCallback("Password: ", false);

        try {
            callbackHandler.handle(callbacks);
        } catch (IOException ioe) {
            LOG.debug(ioe.getMessage());
            throw new LoginException(ioe.getMessage());
        } catch (UnsupportedCallbackException uce) {
            String msg = uce.getCallback().getClass().getName() + " not available to obtain information from user";
            LOG.debug(msg);
            throw new LoginException(msg);
        }

        String user = ((NameCallback) callbacks[0]).getName();
        if (user == null) {
            throw new LoginException("Username can not be null");
        }

        char[] password = ((PasswordCallback) callbacks[1]).getPassword();
        if (password == null) {
            throw new LoginException("Password can not be null");
        }

        if (!engineManager.userExists(engineName, user)) {
            throw new FailedLoginException("User " + user + " does not exist");
        }

        if (!engineManager.checkPassword(engineName, user, new String(password))) {
            throw new FailedLoginException("Password is not valid");
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
