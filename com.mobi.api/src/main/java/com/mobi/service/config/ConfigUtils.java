package com.mobi.service.config;

/*-
 * #%L
 * com.mobi.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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

import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Hashtable;
import java.util.Map;

public class ConfigUtils {

    private static final Logger LOGGER = LoggerFactory.getLogger(ConfigUtils.class);

    /**
     * Save an updated service configuration.
     *
     * @param newConfigurationData The modified map of configuration to persist
     * @param config The configuration object that will be updated
     */
    public static void updateServiceConfig(final Map<String, Object> newConfigurationData, Configuration config) {
        try {
            config.update(new Hashtable<>(newConfigurationData));
        } catch (IOException e) {
            LOGGER.error("Issue updating service configuration for: " + config.getPid(), e);
        }
    }

    /**
     * Save an updated service configuration.
     *
     * @param newConfigurationData The modified map of configuration to persist
     * @param configurationAdmin The configuration admin of the calling service
     * @param serviceName The name of the calling service
     */
    public static void updateServiceConfig(final Map<String, Object> newConfigurationData, ConfigurationAdmin configurationAdmin, String serviceName) {
        try {
            final Configuration config = configurationAdmin.getConfiguration(serviceName);
            updateServiceConfig(newConfigurationData, config);
        } catch (IOException e) {
            LOGGER.error("Could not get configuration for service: " + serviceName, e);
            // Continue along, since we'll just re-generate the service configuration next time the server starts.
        }
    }
}
