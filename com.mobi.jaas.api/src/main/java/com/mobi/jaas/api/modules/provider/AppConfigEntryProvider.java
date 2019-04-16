package com.mobi.jaas.api.modules.provider;

/*-
 * #%L
 * com.mobi.jaas.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

import java.util.Map;

public interface AppConfigEntryProvider {

    /**
     * Returns the name of the {@link javax.security.auth.spi.LoginModule} provided by this AppConfigEntryProvider.
     *
     * @return The {@link Class#getName() name} of the provided {@link javax.security.auth.spi.LoginModule}
     */
    String getModuleName();

    /**
     * The configuration object necessary for configuring the provided {@link javax.security.auth.spi.LoginModule} as a
     * {@link javax.security.auth.login.AppConfigurationEntry}. Expects a minimum of these properties:
     * {@link com.mobi.jaas.api.config.LoginModuleConfig#ENGINE_MANAGER},
     * {@link com.mobi.jaas.api.config.LoginModuleConfig#ENGINE}, `ProxyLoginModule.BUNDLE_ID`,
     * `ProxyLoginModule.MODULE`, and `BundleContext.class.getName()`.
     *
     * @return A {@link Map} of configuration properties for a {@link javax.security.auth.login.AppConfigurationEntry}
     */
    Map<String, Object> getModuleConfig();
}
