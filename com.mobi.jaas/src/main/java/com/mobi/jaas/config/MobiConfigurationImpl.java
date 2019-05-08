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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.modules.provider.AppConfigEntryProvider;
import com.mobi.jaas.proxy.ProxyLoginModule;

import java.util.HashSet;
import java.util.Set;
import javax.security.auth.login.AppConfigurationEntry;
import javax.security.auth.login.Configuration;

@Component(provide = MobiConfiguration.class)
public class MobiConfigurationImpl extends MobiConfiguration {
    private Set<AppConfigEntryProvider> configEntryProviders = new HashSet<>();

    @Reference(type = '*', dynamic = true)
    void addConfigEntryProvider(AppConfigEntryProvider provider) {
        configEntryProviders.add(provider);
    }

    void removeConfigEntryProvider(AppConfigEntryProvider provider) {
        configEntryProviders.removeIf(provider1 -> provider1.getModuleName().equals(provider.getModuleName()));
    }

    @Override
    public AppConfigurationEntry[] getAppConfigurationEntry(String name) {
        if (name.equals("mobi")) {
            return configEntryProviders.stream()
                    .map(AppConfigEntryProvider::getModuleConfig)
                    .map(map -> new AppConfigurationEntry(ProxyLoginModule.class.getName(),
                            AppConfigurationEntry.LoginModuleControlFlag.OPTIONAL, map))
                    .toArray(AppConfigurationEntry[]::new);

        } else {
            return Configuration.getConfiguration().getAppConfigurationEntry(name);
        }
    }
}
