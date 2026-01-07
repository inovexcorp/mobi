package com.mobi.server.impl;

/*-
 * #%L
 * com.mobi.platform.config.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.server.api.MobiConfig;
import com.mobi.server.utils.ServerIdUtils;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.MockitoAnnotations;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;

import java.util.Dictionary;
import java.util.Hashtable;
import java.util.UUID;

public class MobiImplTest {
    private AutoCloseable closeable;
    private MobiImpl impl;
    private MockedStatic<UUID> uuidMock;
    private MockedStatic<ServerIdUtils> serverIdUtilsMock;
    private final UUID serverId = UUID.fromString("98ab4787-549d-3c82-8265-e593d7e944b5");

    @Mock
    MobiConfig mobiConfig;

    @Mock
    private ConfigurationAdmin configurationAdmin;

    @Mock
    private Configuration configuration;

    @Captor
    private ArgumentCaptor<Dictionary<String, Object>> captor;

    @Before
    public void setup() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        uuidMock = mockStatic(UUID.class);
        serverIdUtilsMock = mockStatic(ServerIdUtils.class);

        when(configurationAdmin.getConfiguration(anyString())).thenReturn(configuration);
        when(configuration.getProperties()).thenReturn(new Hashtable<>());
        when(mobiConfig.serverId()).thenReturn(serverId.toString());
        uuidMock.when(() -> UUID.nameUUIDFromBytes(any())).thenReturn(serverId);
        serverIdUtilsMock.when(ServerIdUtils::getServerId).thenReturn(serverId);

        impl = new MobiImpl();
        impl.configurationAdmin = configurationAdmin;
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        uuidMock.close();
        serverIdUtilsMock.close();
    }

    @Test
    public void testGeneratedServerIdIsSaved() throws Exception {
        when(mobiConfig.serverId()).thenReturn(null);
        impl.activate(mobiConfig);
        verify(configuration).update(captor.capture());
        assertEquals(impl.getServerIdentifier().toString(), captor.getValue().get("serverId"));
    }

    @Test
    public void testGeneratedServerIdIsSavedExistingDifferent() throws Exception {
        when(mobiConfig.serverId()).thenReturn("different");
        impl.activate(mobiConfig);
        verify(configuration).update(captor.capture());
        assertEquals(impl.getServerIdentifier().toString(), captor.getValue().get("serverId"));
    }

    @Test
    public void testHostNameProvided() {
        String hostName = "https://www.google.com";
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals(hostName, impl.getHostName());
    }

    @Test
    public void testHostNameIPProvided() {
        String hostName = "http://8.8.8.8";
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals(hostName, impl.getHostName());
    }

    @Test
    public void testHostNameIPNoProtocolProvided() {
        String hostName = "8.8.8.8";
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals("", impl.getHostName());
    }

    @Test
    public void testHostNameLocalHostProvided() {
        String hostName = "https://localhost:8443";
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals(hostName, impl.getHostName());
    }

    @Test
    public void testHostNameLocalHostIPProvided() {
        String hostName = "http://127.0.0.1";
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals(hostName, impl.getHostName());
    }

    @Test
    public void testHostNameProvidedInvalid() {
        String hostName = "someBadHostName";
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals("", impl.getHostName());
    }

    @Test
    public void testHostNameNotProvided() {
        impl.activate(mobiConfig);
        assertEquals("", impl.getHostName());
    }
}
