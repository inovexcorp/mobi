package com.mobi.jaas.config;

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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import com.mobi.jaas.api.config.LoginModuleConfig;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.modules.password.PasswordLoginModule;
import com.mobi.jaas.api.modules.token.TokenLoginModule;
import com.mobi.jaas.proxy.ProxyLoginModule;
import com.mobi.jaas.api.config.MobiConfiguration;
import org.osgi.framework.BundleContext;

import java.util.HashMap;
import java.util.Map;
import javax.security.auth.login.AppConfigurationEntry;
import javax.security.auth.login.Configuration;

@Component(
        name = MobiConfigurationImpl.COMPONENT_NAME,
        provide = MobiConfiguration.class
    )
public class MobiConfigurationImpl extends MobiConfiguration {
    public static final String COMPONENT_NAME = "MobiConfiguration";
    private static final String RDF_ENGINE = "RdfEngine";
    protected EngineManager engineManager;
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
    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Override
    public AppConfigurationEntry[] getAppConfigurationEntry(String name) {
        if (name.equals("mobi")) {
            Map<String, Object> tokenOptions = new HashMap<>();
            tokenOptions.put(LoginModuleConfig.ENGINE_MANAGER, engineManager);
            tokenOptions.put(LoginModuleConfig.ENGINE, RDF_ENGINE);
            tokenOptions.put(BundleContext.class.getName(), context);
            tokenOptions.put(ProxyLoginModule.BUNDLE_ID, Long.toString(context.getBundle().getBundleId()));
            tokenOptions.put(ProxyLoginModule.MODULE, TokenLoginModule.class.getName());

            Map<String, Object> passwordOptions = new HashMap<>();
            passwordOptions.put(LoginModuleConfig.ENGINE_MANAGER, engineManager);
            passwordOptions.put(LoginModuleConfig.ENGINE, RDF_ENGINE);
            passwordOptions.put(BundleContext.class.getName(), context);
            passwordOptions.put(ProxyLoginModule.BUNDLE_ID, Long.toString(context.getBundle().getBundleId()));
            passwordOptions.put(ProxyLoginModule.MODULE, PasswordLoginModule.class.getName());

            return new AppConfigurationEntry[] {
                    new AppConfigurationEntry(ProxyLoginModule.class.getName(),
                            AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL, passwordOptions),
                    new AppConfigurationEntry(ProxyLoginModule.class.getName(),
                            AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL, tokenOptions)
            };
        } else {
            return Configuration.getConfiguration().getAppConfigurationEntry(name);
        }
    }
}
