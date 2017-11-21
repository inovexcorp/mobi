package com.mobi.federation.utils.api.jaas.token.config;

/*-
 * #%L
 * com.mobi.federation.api
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import com.mobi.federation.utils.api.UserUtils;
import com.mobi.federation.utils.api.jaas.token.FederationTokenLoginModule;
import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.proxy.ProxyLoginModule;
import org.osgi.framework.BundleContext;

import java.util.HashMap;
import java.util.Map;
import javax.security.auth.login.AppConfigurationEntry;
import javax.security.auth.login.Configuration;

@Component(provide = FederationConfiguration.class)
public class FederationConfiguration extends MobiConfiguration {
    public static final String USER_UTILS = "user-utils";
    protected UserUtils userUtils;
    private BundleContext context;

    @Activate
    protected void start(BundleContext context) {
        this.context = context;
    }

    @Modified
    protected void modified(BundleContext context) {
        this.context = context;
    }

    @Reference
    public void setUserUtils(UserUtils userUtils) {
        this.userUtils = userUtils;
    }

    @Override
    public AppConfigurationEntry[] getAppConfigurationEntry(String name) {
        if (name.equals("mobi-federation")) {
            Map<String, Object> federationTokenOptions = new HashMap<>();
            federationTokenOptions.put(USER_UTILS, userUtils);
            federationTokenOptions.put(BundleContext.class.getName(), context);
            federationTokenOptions.put(ProxyLoginModule.BUNDLE_ID, Long.toString(context.getBundle().getBundleId()));
            federationTokenOptions.put(ProxyLoginModule.MODULE, FederationTokenLoginModule.class.getName());

            return new AppConfigurationEntry[] {
                    new AppConfigurationEntry(ProxyLoginModule.class.getName(),
                            AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL, federationTokenOptions)
            };
        } else {
            return Configuration.getConfiguration().getAppConfigurationEntry(name);
        }
    }
}
