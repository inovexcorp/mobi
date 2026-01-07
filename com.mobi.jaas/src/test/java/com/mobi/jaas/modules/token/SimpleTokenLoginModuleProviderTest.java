package com.mobi.jaas.modules.token;

/*-
 * #%L
 * com.mobi.jaas
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
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.when;

import com.mobi.jaas.api.config.LoginModuleConfig;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.modules.token.SimpleTokenLoginModule;
import com.mobi.jaas.api.modules.token.TokenLoginModule;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.jaas.proxy.ProxyLoginModule;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;

import java.util.Map;

public class SimpleTokenLoginModuleProviderTest {
    private AutoCloseable closeable;
    private SimpleTokenLoginModuleProvider provider;

    private long bundleId = 10L;

    @Mock
    private EngineManager engineManager;

    @Mock
    private TokenManager tokenManager;

    @Mock
    private BundleContext context;

    @Mock
    private Bundle bundle;

    @Before
    public void before() {
        closeable = MockitoAnnotations.openMocks(this);
        when(context.getBundle()).thenReturn(bundle);
        when(bundle.getBundleId()).thenReturn(bundleId);

        provider = new SimpleTokenLoginModuleProvider();
        provider.engineManager = engineManager;
        provider.tokenManager = tokenManager;
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void setupTest() throws Exception {
        provider.start(context);
        assertEquals(context, provider.context);
    }

    @Test
    public void getModuleNameTest() throws Exception {
        assertEquals(SimpleTokenLoginModule.class.getName(), provider.getModuleName());
    }

    @Test
    public void getModuleConfigTest() throws Exception {
        provider.context = context;
        Map<String, Object> config = provider.getModuleConfig();
        assertTrue(config.containsKey(LoginModuleConfig.ENGINE_MANAGER));
        assertEquals(engineManager, config.get(LoginModuleConfig.ENGINE_MANAGER));
        assertTrue(config.containsKey(BundleContext.class.getName()));
        assertEquals(context, config.get(BundleContext.class.getName()));
        assertTrue(config.containsKey(ProxyLoginModule.BUNDLE_ID));
        assertEquals(Long.toString(bundleId), config.get(ProxyLoginModule.BUNDLE_ID));
        assertTrue(config.containsKey(ProxyLoginModule.MODULE));
        assertEquals(SimpleTokenLoginModule.class.getName(), config.get(ProxyLoginModule.MODULE));
        assertTrue(config.containsKey(TokenLoginModule.TOKEN_MANAGER));
        assertEquals(tokenManager, config.get(TokenLoginModule.TOKEN_MANAGER));
    }
}
