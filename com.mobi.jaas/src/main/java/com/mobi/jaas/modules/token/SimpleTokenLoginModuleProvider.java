package com.mobi.jaas.modules.token;

/*-
 * #%L
 * com.mobi.jaas
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import com.mobi.jaas.api.config.LoginModuleConfig;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.modules.provider.AppConfigEntryProvider;
import com.mobi.jaas.api.modules.token.SimpleTokenLoginModule;
import com.mobi.jaas.api.modules.token.TokenLoginModule;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.jaas.proxy.ProxyLoginModule;
import org.osgi.framework.BundleContext;

import java.util.HashMap;
import java.util.Map;

@Component
public class SimpleTokenLoginModuleProvider implements AppConfigEntryProvider {

    protected BundleContext context;

    @Reference
    EngineManager engineManager;

    @Reference
    TokenManager tokenManager;

    @Activate
    protected void start(BundleContext context) {
        this.context = context;
    }

    @Modified
    protected void modified(BundleContext context) {
        start(context);
    }

    @Override
    public String getModuleName() {
        return SimpleTokenLoginModule.class.getName();
    }

    @Override
    public Map<String, Object> getModuleConfig() {
        Map<String, Object> tokenOptions = new HashMap<>();
        tokenOptions.put(LoginModuleConfig.ENGINE_MANAGER, engineManager);
        tokenOptions.put(BundleContext.class.getName(), context);
        tokenOptions.put(ProxyLoginModule.BUNDLE_ID, Long.toString(context.getBundle().getBundleId()));
        tokenOptions.put(ProxyLoginModule.MODULE, SimpleTokenLoginModule.class.getName());
        tokenOptions.put(TokenLoginModule.TOKEN_MANAGER, tokenManager);
        return tokenOptions;
    }
}
