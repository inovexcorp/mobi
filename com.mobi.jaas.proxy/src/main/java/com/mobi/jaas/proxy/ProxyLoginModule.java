package com.mobi.jaas.proxy;

/*-
 * #%L
 * com.mobi.jaas.api
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

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;

import java.util.Map;
import javax.security.auth.Subject;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.login.LoginException;
import javax.security.auth.spi.LoginModule;

public class ProxyLoginModule implements LoginModule {

    public static final String MODULE = "module";
    public static final String BUNDLE_ID = "bundle.id";

    private LoginModule target = null;

    @Override
    public void initialize(Subject subject, CallbackHandler callbackHandler, Map<String, ?> sharedState,
                           Map<String, ?> options) {
        BundleContext context = (BundleContext) options.get(BundleContext.class.getName());
        if (context == null) {
            throw new IllegalStateException("Option " + BundleContext.class.getName()
                    + " must be set to the BundleContext of the module");
        }
        String module = (String) options.get(MODULE);
        if (module == null) {
            throw new IllegalStateException("Option " + MODULE + " must be set to the name of the module");
        }
        String bundleId = (String) options.get(BUNDLE_ID);
        if (bundleId == null) {
            throw new IllegalStateException("Option " + BUNDLE_ID
                    + " must be set to the name of the bundle with the module");
        }
        Bundle bundle = context.getBundle(Long.parseLong(bundleId));
        if (bundle == null) {
            throw new IllegalStateException("No bundle found for id " + bundleId);
        }
        try {
            target = (LoginModule) bundle.loadClass(module).newInstance();
        } catch (Exception e) {
            throw new IllegalStateException("Can not load or create login module " + module
                    + " for bundle " + bundleId, e);
        }
        target.initialize(subject, callbackHandler, sharedState, options);
    }

    @Override
    public boolean login() throws LoginException {
        return target.login();
    }

    @Override
    public boolean commit() throws LoginException {
        return target.commit();
    }

    @Override
    public boolean abort() throws LoginException {
        return target.abort();
    }

    @Override
    public boolean logout() throws LoginException {
        return target.logout();
    }
}
