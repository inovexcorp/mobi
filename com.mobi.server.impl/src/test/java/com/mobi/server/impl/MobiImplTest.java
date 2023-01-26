package com.mobi.server.impl;

/*-
 * #%L
 * com.mobi.platform.config.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.server.api.MobiConfig;
import com.mobi.server.api.ServerUtils;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;

import java.util.Dictionary;
import java.util.Hashtable;
import java.util.UUID;

public class MobiImplTest {
    private AutoCloseable closeable;

    @Mock
    MobiConfig mobiConfig;

    @Mock
    private ConfigurationAdmin configurationAdmin;

    @Mock
    private Configuration configuration;

    @Mock
    private ServerUtils utils;

    @Captor
    private ArgumentCaptor<Dictionary<String, Object>> captor;

    @Before
    public void setup() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void testGeneratedServerIdIsSaved() throws Exception {
        when(utils.getMacId()).thenReturn("serverId".getBytes());
        when(configurationAdmin.getConfiguration(anyString())).thenReturn(configuration);
        when(configuration.getProperties()).thenReturn(new Hashtable<>());

        MobiImpl impl = new MobiImpl();
        impl.configurationAdmin = configurationAdmin;
        impl.utils = utils;
        impl.activate(mobiConfig);
        verify(configuration).update(captor.capture());
        verify(utils).getMacId();
        assertEquals(impl.getServerIdentifier().toString(), captor.getValue().get("serverId"));
    }

    @Test
    public void testAlreadyHasServerId() throws Exception {
        MobiImpl impl = new MobiImpl();
        String val = UUID.randomUUID().toString();
        when(mobiConfig.serverId()).thenReturn(val);
        
        impl.activate(mobiConfig);
        assertEquals(val, impl.getServerIdentifier().toString());
    }

    @Test
    public void testHostNameProvided() throws Exception {
        MobiImpl impl = new MobiImpl();
        String val = UUID.randomUUID().toString();
        String hostName = "https://www.google.com";
        when(mobiConfig.serverId()).thenReturn(val);
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals(hostName, impl.getHostName());
    }

    @Test
    public void testHostNameIPProvided() throws Exception {
        MobiImpl impl = new MobiImpl();
        String val = UUID.randomUUID().toString();
        String hostName = "http://8.8.8.8";
        when(mobiConfig.serverId()).thenReturn(val);
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals(hostName, impl.getHostName());
    }

    @Test
    public void testHostNameIPNoProtocolProvided() throws Exception {
        MobiImpl impl = new MobiImpl();
        String val = UUID.randomUUID().toString();
        String hostName = "8.8.8.8";
        when(mobiConfig.serverId()).thenReturn(val);
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals("", impl.getHostName());
    }

    @Test
    public void testHostNameLocalHostProvided() throws Exception {
        MobiImpl impl = new MobiImpl();
        String val = UUID.randomUUID().toString();
        String hostName = "https://localhost:8443";
        when(mobiConfig.serverId()).thenReturn(val);
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals(hostName, impl.getHostName());
    }

    @Test
    public void testHostNameLocalHostIPProvided() throws Exception {
        MobiImpl impl = new MobiImpl();
        String val = UUID.randomUUID().toString();
        String hostName = "http://127.0.0.1";
        when(mobiConfig.serverId()).thenReturn(val);
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals(hostName, impl.getHostName());
    }

    @Test
    public void testHostNameProvidedInvalid() throws Exception {
        MobiImpl impl = new MobiImpl();
        String val = UUID.randomUUID().toString();
        String hostName = "someBadHostName";
        when(mobiConfig.serverId()).thenReturn(val);
        when(mobiConfig.hostName()).thenReturn(hostName);

        impl.activate(mobiConfig);
        assertEquals("", impl.getHostName());
    }

    @Test
    public void testHostNameNotProvided() throws Exception {
        MobiImpl impl = new MobiImpl();
        String val = UUID.randomUUID().toString();
        when(mobiConfig.serverId()).thenReturn(val);

        impl.activate(mobiConfig);
        assertEquals("", impl.getHostName());
    }
}
