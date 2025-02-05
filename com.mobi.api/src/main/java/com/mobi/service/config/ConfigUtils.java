package com.mobi.service.config;

/*-
 * #%L
 * com.mobi.api
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

import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Collections;
import java.util.Dictionary;
import java.util.Hashtable;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.lang.reflect.Method;

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
            LOGGER.error("Issue updating service configuration for: {}", config.getPid(), e);
        }
    }

    /**
     * Save an updated service configuration.
     *
     * @param newConfigurationData The modified map of configuration to persist
     * @param configurationAdmin The configuration admin of the calling service
     * @param serviceName The name of the calling service
     */
    public static void updateServiceConfig(final Map<String, Object> newConfigurationData,
            ConfigurationAdmin configurationAdmin, String serviceName) {
        try {
            final Configuration config = configurationAdmin.getConfiguration(serviceName);
            updateServiceConfig(newConfigurationData, config);
        } catch (IOException e) {
            LOGGER.error("Could not get configuration for service: {}", serviceName, e);
            // Continue along, since we'll just re-generate the service configuration next
            // time the server starts.
        }
    }

    /**
     * Get a map of the properties to values of the passed in Configuration object.
     *
     * @param config The configuration to retrieve properties for.
     * @return Map of properties to values of the passed in config.
     */
    public static Map<String, Object> getPropertiesMap(Configuration config) {
        Dictionary<String, Object> propertiesDict = config.getProperties();
        List<String> keys = Collections.list(propertiesDict.keys());
        return keys.stream()
                .collect(Collectors.toMap(Function.identity(), propertiesDict::get));
    }

    /**
     * Maps the methods of a given configuration class to their respective metadata information.
     * This method iterates over all declared methods of the provided class and looks for
     * the {@link ConfigurationMetadata} annotation. For each method that has this annotation,
     * it creates a {@link ConfigMethodInfo} object containing the metadata details, and stores it
     * in a map with the method name (replacing underscores with periods) as the key.
     *
     * @param configClass The class whose methods are to be inspected. It must be a class containing
     *                    methods annotated with {@link ConfigurationMetadata}.
     * @return A {@link Map} where the key is the method name (with underscores replaced by periods),
     *         and the value is the corresponding {@link ConfigMethodInfo} that holds the metadata
     *         about that method, such as its name, description, type, and other configuration details.
     */
    public static Map<String, ConfigMethodInfo> mapMethodsToInfo(Class<?> configClass) {
        Map<String, ConfigMethodInfo> methodInfoMap = new LinkedHashMap<>();
        Method[] declaredMethods = configClass.getDeclaredMethods();

        for (Method method : declaredMethods) {
            ConfigurationMetadata customAttrDef = method.getAnnotation(ConfigurationMetadata.class);
            if (customAttrDef == null) {
                continue;  // Skip methods without the ConfigurationMetadata annotation
            }
            String methodName = method.getName().replace("_", ".");
            methodInfoMap.put(methodName, new ConfigMethodInfo(
                    method.getName(),
                    customAttrDef.name(),
                    customAttrDef.description(),
                    customAttrDef.type(),
                    customAttrDef.required(),
                    customAttrDef.masked()));
        }
        return methodInfoMap;
    }
}
