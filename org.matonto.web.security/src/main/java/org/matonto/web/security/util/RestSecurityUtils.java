package org.matonto.web.security.util;

/*-
 * #%L
 * org.matonto.web.security
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

import org.matonto.federation.api.FederationService;
import org.matonto.federation.api.token.FederationTokenCallback;
import org.matonto.jaas.api.modules.token.TokenCallback;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.Subject;
import javax.security.auth.callback.Callback;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.callback.NameCallback;
import javax.security.auth.callback.PasswordCallback;
import javax.security.auth.callback.UnsupportedCallbackException;
import javax.security.auth.login.Configuration;
import javax.security.auth.login.LoginContext;
import javax.security.auth.login.LoginException;

public class RestSecurityUtils {

    private static final Logger LOG = LoggerFactory.getLogger(RestSecurityUtils.class.getName());

    public static boolean authenticateToken(String realm, Subject subject, String tokenString,
                                            Configuration configuration) {
        return authenticateCommon(realm, subject, callbacks -> {
            for (Callback callback : callbacks) {
                if (callback instanceof TokenCallback) {
                    ((TokenCallback) callback).setTokenString(tokenString);
                } else {
                    throw new UnsupportedCallbackException(callback);
                }
            }
        }, configuration);
    }

    public static boolean authenticateToken(String realm, Subject subject, String tokenString,
                                            Configuration configuration, FederationService service) {
        return authenticateCommon(realm, subject, callbacks -> {
            for (Callback callback : callbacks) {
                if (callback instanceof FederationTokenCallback) {
                    ((FederationTokenCallback) callback).setTokenString(tokenString);
                    ((FederationTokenCallback) callback).setService(service);
                } else {
                    throw new UnsupportedCallbackException(callback);
                }
            }
        }, configuration);
    }

    public static boolean authenticateUser(String realm, Subject subject, String username, String password,
                                           Configuration configuration) {
        return authenticateCommon(realm, subject, callbacks -> {
            for (Callback callback : callbacks) {
                if (callback instanceof NameCallback) {
                    ((NameCallback) callback).setName(username);
                } else if (callback instanceof PasswordCallback) {
                    ((PasswordCallback) callback).setPassword(password.toCharArray());
                } else {
                    throw new UnsupportedCallbackException(callback);
                }
            }
        }, configuration);
    }

    private static boolean authenticateCommon(String realm, Subject subject, CallbackHandler handler,
                                              Configuration configuration) {
        try {
            LoginContext loginContext = new LoginContext(realm, subject, handler, configuration);
            loginContext.login();
        } catch (LoginException e) {
            LOG.debug("Authentication failed.", e);
            return false;
        }
        return true;
    }
}
