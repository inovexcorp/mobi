package org.matonto.jaas.api.modules.password;

/*-
 * #%L
 * org.matonto.jaas
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

import org.apache.log4j.Logger;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.principals.UserPrincipal;
import org.matonto.jaas.api.config.LoginModuleConfig;

import javax.security.auth.Subject;
import javax.security.auth.callback.*;
import javax.security.auth.login.FailedLoginException;
import javax.security.auth.login.LoginException;
import javax.security.auth.spi.LoginModule;
import java.io.IOException;
import java.util.Map;

public class PasswordLoginModule implements LoginModule {
    private static final Logger LOG = Logger.getLogger(PasswordLoginModule.class.getName());
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
        LOG.info("Initialized PasswordLoginModule engineName=" + engineName);
    }

    @Override
    public boolean login() throws LoginException {
        LOG.info("Verifying password...");

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
            String msg = uce.getMessage() + " not available to obtain information from user";
            LOG.debug(msg);
            throw new LoginException(msg);
        }

        String user = ((NameCallback) callbacks[0]).getName();
        if (user == null) {
            throw new LoginException("Username can not be null");
        }

        if (((PasswordCallback) callbacks[1]).getPassword() == null) {
            throw new LoginException("Password can not be null");
        }
        String password = new String(((PasswordCallback) callbacks[1]).getPassword());

        if (!engineManager.userExists(engineName, user)) {
            throw new FailedLoginException("User " + user + " does not exist");
        }

        if (!engineManager.checkPassword(engineName, user, password)) {
            throw new FailedLoginException("Password is not valid");
        }

        this.userId = user;
        LOG.info("Successfully logged in " + user);
        return false;
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
