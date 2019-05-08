package com.mobi.cache.impl.repository.jcache;

/*-
 * #%L
 * com.mobi.cache.impl.repository
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.verify;

import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.net.URI;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import javax.cache.CacheManager;
import javax.cache.configuration.OptionalFeature;

public class RepositoryCachingProviderTest {

    private RepositoryCachingProvider repositoryCachingProvider;
    private URI providerUri;
    private ClassLoader providerClassLoader;
    private Properties providerProperties;

    @Mock
    private RepositoryCacheManager repositoryCacheManager;

    @Before
    public void setUp() throws Exception {
        repositoryCachingProvider = new RepositoryCachingProvider();
        providerUri = new URI(RepositoryCachingProvider.class.getName());
        providerClassLoader = RepositoryCachingProvider.class.getClassLoader();
        providerProperties = new Properties();

        MockitoAnnotations.initMocks(this);
        repositoryCachingProvider.setCacheManager(repositoryCacheManager);
    }

    @Test
    public void getDefaultClassLoaderTest() {
        ClassLoader classLoader = repositoryCachingProvider.getDefaultClassLoader();
        assertEquals(providerClassLoader, classLoader);
    }

    @Test
    public void getDefaultUriTest() {
        URI uri = repositoryCachingProvider.getDefaultURI();
        assertEquals(RepositoryCachingProvider.class.getName(), uri.getRawPath());
        assertEquals(uri, providerUri);
    }

    @Test
    public void getDefaultPropertiesTest() {
        Properties properties = repositoryCachingProvider.getDefaultProperties();
        assertEquals(providerProperties, properties);
    }

    @Test
    public void getCacheManagerTest() {
        CacheManager cacheManager = repositoryCachingProvider.getCacheManager();
        assertTrue(cacheManager instanceof RepositoryCacheManager);
        assertEquals(repositoryCacheManager, cacheManager);
    }

    @Test
    public void getCacheManagerWithParametersTest() {
        CacheManager cacheManager = repositoryCachingProvider.getCacheManager(providerUri, providerClassLoader);
        assertTrue(cacheManager instanceof RepositoryCacheManager);
        assertEquals(repositoryCacheManager, cacheManager);
    }

    @Test
    public void getCacheManagerWithParametersURINoMatchTest() {
        CacheManager cacheManager = repositoryCachingProvider.getCacheManager(providerUri, providerClassLoader);
        assertTrue(cacheManager instanceof RepositoryCacheManager);
        assertEquals(repositoryCacheManager, cacheManager);
    }

    @Test
    public void getCacheManagerWithAllParametersTest() {
        CacheManager cacheManager = repositoryCachingProvider.getCacheManager(providerUri, providerClassLoader, providerProperties);
        assertTrue(cacheManager instanceof RepositoryCacheManager);
        assertEquals(repositoryCacheManager, cacheManager);
    }

    @Test
    public void getCacheManagerMultipleThreadsTest() throws Exception {
        int threads = 10;
        ExecutorService service = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicBoolean running = new AtomicBoolean();
        AtomicInteger overlaps = new AtomicInteger();
        Collection<Future<Object>> futures = new ArrayList<>(threads);

        for (int t = 0; t < threads; ++t) {
            if (t == 6) {
                futures.add(
                        service.submit(() -> {
                            latch.await();
                            if (running.get()) {
                                overlaps.incrementAndGet();
                            }
                            running.set(true);
                            repositoryCachingProvider.close();
                            running.set(false);
                            return "CLOSED CACHE MANAGER";
                        }));
            } else {
                futures.add(
                        service.submit(() -> {
                            latch.await();
                            if (running.get()) {
                                overlaps.incrementAndGet();
                            }
                            running.set(true);
                            CacheManager cacheManager = repositoryCachingProvider.getCacheManager();
                            running.set(false);
                            return cacheManager;
                        }));
            }
        }
        latch.countDown();
        List<Object> cacheManagers = new ArrayList<>();
        for (Future<Object> f : futures) {
            cacheManagers.add(f.get());
        }
        assertTrue(overlaps.get() > 0);
        assertEquals(cacheManagers.size(), threads);
        assertTrue(cacheManagers.contains("CLOSED CACHE MANAGER"));
    }

    @Test
    public void closeWithClassLoaderTest() {
        repositoryCachingProvider.close(providerClassLoader);
        verify(repositoryCacheManager).close();
    }

    @Test
    public void closeWithUriAndClassLoaderTest() {
        repositoryCachingProvider.close(providerUri, providerClassLoader);
        verify(repositoryCacheManager).close();
    }

    @Test
    public void isSupportedTest() {
        assertTrue(repositoryCachingProvider.isSupported(OptionalFeature.STORE_BY_REFERENCE));
        assertFalse(repositoryCachingProvider.isSupported(null));
    }
}
