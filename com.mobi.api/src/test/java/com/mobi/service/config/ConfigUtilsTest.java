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

import static com.mobi.service.config.ConfigUtils.updateServiceConfig;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.IOException;
import java.util.Map;
import java.util.HashMap;
import java.util.Dictionary;
import java.util.Hashtable;

import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ConfigUtilsTest {
    private AutoCloseable closeable;

    @Mock
    private Configuration mockConfig;

    @Mock
    private ConfigurationAdmin mockConfigurationAdmin;

    private static MockedStatic<LoggerFactory> loggerFactoryMockedStatic;
    private static Logger mockLogger;

    @BeforeClass
    public static void setupStaticMocks() {
        loggerFactoryMockedStatic = Mockito.mockStatic(LoggerFactory.class);
        mockLogger = Mockito.mock(Logger.class);
        loggerFactoryMockedStatic.when(() -> LoggerFactory.getLogger(ConfigUtils.class)).thenReturn(mockLogger);
    }

    @AfterClass
    public static void cleanUpStaticMocks() {
        if (loggerFactoryMockedStatic != null) {
            loggerFactoryMockedStatic.close();
        }
    }

    @Before
    public void setup() {
        closeable = MockitoAnnotations.openMocks(this);
    }

    @After
    public void cleanUp() throws Exception {
        Mockito.reset(mockLogger);
        closeable.close();
    }

    /* updateServiceConfig(newConfigurationData, configurationAdmin) */

    @Test
    public void testUpdateServiceConfigSuccess() throws IOException {
        Map<String, Object> newConfigurationData = new HashMap<>();
        newConfigurationData.put("key", "value");

        updateServiceConfig(newConfigurationData, mockConfig);

        verify(mockConfig).update(any());
        verify(mockLogger, times(0)).error(any(String.class), any(String.class), any(Exception.class));
    }

    @Test
    public void testUpdateServiceConfigError() throws IOException {
        when(mockConfig.getPid()).thenReturn("servicePid");

        Map<String, Object> newConfigurationData = new HashMap<>();
        newConfigurationData.put("key", "value");
        doThrow(new IOException("Update failed")).when(mockConfig).update(any());

        updateServiceConfig(newConfigurationData, mockConfig);

        verify(mockLogger).error(eq("Issue updating service configuration for: {}"), eq("servicePid"), any(IOException.class));
    }

    /* updateServiceConfig(newConfigurationData, configurationAdmin, serviceName) */

    @Test
    public void testUpdateServiceConfigWithConfigurationAdmin() throws IOException {
        Map<String, Object> newConfigurationData = new HashMap<>();
        newConfigurationData.put("key", "value");
        String serviceName = "testService";
        when(mockConfigurationAdmin.getConfiguration(serviceName)).thenReturn(mockConfig);

        updateServiceConfig(newConfigurationData, mockConfigurationAdmin, serviceName);

        verify(mockConfigurationAdmin).getConfiguration(serviceName);
        verify(mockConfig).update(any());
        verify(mockLogger, times(0)).error(any(String.class), any(String.class), any(Exception.class));
    }

    @Test
    public void testUpdateServiceConfigWithConfigurationAdminError() throws IOException {
        Map<String, Object> newConfigurationData = new HashMap<>();
        newConfigurationData.put("key", "value");
        String serviceName = "testService";

        when(mockConfigurationAdmin.getConfiguration(serviceName)).thenThrow(new IOException("Could not get configuration"));

        updateServiceConfig(newConfigurationData, mockConfigurationAdmin, serviceName);

        verify(mockLogger).error(eq("Could not get configuration for service: {}"), eq(serviceName), any(IOException.class));
    }

    /* getPropertiesMap(Configuration) */

    @Test
    public void testGetPropertiesMap() {
        Dictionary<String, Object> mockProperties = new Hashtable<>();
        mockProperties.put("key1", "value1");
        mockProperties.put("key2", "value2");

        when(mockConfig.getProperties()).thenReturn(mockProperties);

        Map<String, Object> propertiesMap = ConfigUtils.getPropertiesMap(mockConfig);
        assertEquals(2, propertiesMap.size());
        assertEquals("value1", propertiesMap.get("key1"));
        assertEquals("value2", propertiesMap.get("key2"));
    }

    @Test
    public void testMapMethodsToInfo() {
        Map<String, ConfigMethodInfo> result = ConfigUtils.mapMethodsToInfo(TestConfig.class);

        assertNotNull("Result map should not be null.", result);
        assertEquals("There should be 2 methods in the map.", 2, result.size());

        ConfigMethodInfo methodOneInfo = result.get("methodOne");
        assertNotNull("Method one should be in the map.", methodOneInfo);
        assertEquals("The name should match.", "testMethod1", methodOneInfo.name());
        assertEquals("The description should match.", "First method", methodOneInfo.description());
        assertEquals("The type should match.", TypeReturn.STRING, methodOneInfo.type());
        assertTrue("The method should be marked as required.", methodOneInfo.required());
        assertFalse("The method should not be masked.", methodOneInfo.masked());

        ConfigMethodInfo methodTwoInfo = result.get("methodTwo");
        assertNotNull("Method two should be in the map.", methodTwoInfo);
        assertEquals("The name should match.", "testMethod2", methodTwoInfo.name());
        assertEquals("The description should match.", "Second method", methodTwoInfo.description());
        assertEquals("The type should match.", TypeReturn.NUMBER, methodTwoInfo.type());
        assertFalse("The method should not be required.", methodTwoInfo.required());
        assertTrue("The method should be masked.", methodTwoInfo.masked());

        assertNull("Method without annotation should not be in the map.", result.get("methodWithoutAnnotation"));
    }

    private interface TestConfig {
        @ConfigurationMetadata(name = "testMethod1", description = "First method", type = TypeReturn.STRING,
                required = true, masked = false)
        public String methodOne();

        @ConfigurationMetadata(name = "testMethod2", description = "Second method", type = TypeReturn.NUMBER,
                required = false, masked = true)
        public int methodTwo();

        // A method without the annotation, should not be included in the map
        public void methodWithoutAnnotation();
    }
}