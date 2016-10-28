package org.matonto.jaas.config;

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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.apache.log4j.Logger;
import org.matonto.jaas.api.config.LoginModuleConfig;
import org.matonto.jaas.api.config.MatontoConfiguration;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.modules.password.PasswordLoginModule;
import org.matonto.jaas.api.modules.token.TokenLoginModule;
import org.matonto.jaas.proxy.ProxyLoginModule;
import org.osgi.framework.BundleContext;

import javax.security.auth.login.AppConfigurationEntry;
import javax.security.auth.login.Configuration;
import java.util.HashMap;
import java.util.Map;

@Component(
        name = MatontoConfigurationImpl.COMPONENT_NAME,
        provide = MatontoConfiguration.class
    )
public class MatontoConfigurationImpl extends MatontoConfiguration {
    private static final Logger log = Logger.getLogger(MatontoConfigurationImpl.class);
    public static final String COMPONENT_NAME = "org.matonto.jaas.api.config.MatontoConfiguration";
    private static final String RDF_ENGINE = "org.matonto.jaas.engines.RdfEngine";
    protected EngineManager engineManager;
    private BundleContext context;

    @Activate
    protected void start(BundleContext context) {
        this.context = context;
    }

    @Reference
    public void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Override
    public AppConfigurationEntry[] getAppConfigurationEntry(String name) {
        if (name.equals("matonto")) {
            Map<String, Object> tokenOptions = new HashMap<>();
            tokenOptions.put(LoginModuleConfig.ENGINE_MANAGER, engineManager);
            tokenOptions.put(LoginModuleConfig.ENGINE, RDF_ENGINE);
            tokenOptions.put(ProxyLoginModule.BUNDLE_CONTEXT, context);
            tokenOptions.put(ProxyLoginModule.BUNDLE_ID, Long.toString(context.getBundle().getBundleId()));
            tokenOptions.put(ProxyLoginModule.MODULE, TokenLoginModule.class.getName());

            Map<String, Object> passwordOptions = new HashMap<>();
            passwordOptions.put(LoginModuleConfig.ENGINE_MANAGER, engineManager);
            passwordOptions.put(LoginModuleConfig.ENGINE, RDF_ENGINE);
            passwordOptions.put(ProxyLoginModule.BUNDLE_CONTEXT, context);
            passwordOptions.put(ProxyLoginModule.BUNDLE_ID, Long.toString(context.getBundle().getBundleId()));
            passwordOptions.put(ProxyLoginModule.MODULE, PasswordLoginModule.class.getName());

            /*return new AppConfigurationEntry[] {
                    new AppConfigurationEntry(PasswordLoginModule.class.getName(),
                            AppConfigurationEntry.LoginModuleControlFlag.SUFFICIENT, passwordOptions),
                    new AppConfigurationEntry(TokenLoginModule.class.getName(),
                            AppConfigurationEntry.LoginModuleControlFlag.SUFFICIENT, tokenOptions)
            };*/
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
